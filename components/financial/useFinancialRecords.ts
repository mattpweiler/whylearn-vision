"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  AssetItem,
  DEFAULT_FINANCIAL_SETTINGS,
  ExpenseItem,
  FinancialItem,
  FinancialSettings,
  IncomeItem,
  LiabilityItem,
  MonthlyStatement,
} from "@/components/financial/types";

type ItemSetter<T> = (next: T[]) => void;

const mapNumeric = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapCollection = <T extends FinancialItem>(rows?: Record<string, unknown>[]) =>
  (rows ?? []).map((row) => ({
    id: String(row.id),
    description: (row.description as string) ?? "",
    amount: mapNumeric(row.amount as number | string | null | undefined),
  })) as T[];

const mapStatements = (rows?: Record<string, unknown>[]) =>
  (rows ?? []).map((row) => ({
    id: String(row.id),
    month: ((row.statement_month as string) ?? "").slice(0, 7),
    income: mapNumeric(row.actual_income as number | string | null | undefined),
    expenses: mapNumeric(
      row.actual_expenses as number | string | null | undefined
    ),
    notes: (row.notes as string) ?? "",
  })) as MonthlyStatement[];

interface UseFinancialRecordsResult {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  settings: FinancialSettings;
  updateIncomes: ItemSetter<IncomeItem>;
  updateExpenses: ItemSetter<ExpenseItem>;
  updateAssets: ItemSetter<AssetItem>;
  updateLiabilities: ItemSetter<LiabilityItem>;
  updateSettings: (next: FinancialSettings) => void;
  statements: MonthlyStatement[];
  updateStatements: (next: MonthlyStatement[]) => void;
  isLoading: boolean;
}

export const useFinancialRecords = (enabled: boolean): UseFinancialRecordsResult => {
  const { supabase, session } = useSupabase();
  const userId = session?.user.id;
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([]);
  const [settings, setSettings] = useState<FinancialSettings>(
    DEFAULT_FINANCIAL_SETTINGS
  );
  const [statements, setStatements] = useState<MonthlyStatement[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const [
          incomeResult,
          expenseResult,
          assetResult,
          liabilityResult,
          settingsResult,
          statementsResult,
        ] = await Promise.all([
          supabase
            .from("financial_incomes")
            .select("id, description, amount")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("financial_expenses")
            .select("id, description, amount")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("financial_assets")
            .select("id, description, amount")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("financial_liabilities")
            .select("id, description, amount")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("financial_settings")
            .select(
              "annual_return_rate, inflation_rate, projection_years"
            )
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("financial_monthly_statements")
            .select(
              "id, statement_month, actual_income, actual_expenses, notes"
            )
            .eq("user_id", userId)
            .order("statement_month", { ascending: true }),
        ]);

        if (cancelled) return;
        if (incomeResult.error) throw incomeResult.error;
        if (expenseResult.error) throw expenseResult.error;
        if (assetResult.error) throw assetResult.error;
        if (liabilityResult.error) throw liabilityResult.error;
        if (settingsResult.error) throw settingsResult.error;
        if (statementsResult.error) throw statementsResult.error;

        setIncomes(mapCollection<IncomeItem>(incomeResult.data ?? []));
        setExpenses(mapCollection<ExpenseItem>(expenseResult.data ?? []));
        setAssets(mapCollection<AssetItem>(assetResult.data ?? []));
        setLiabilities(mapCollection<LiabilityItem>(liabilityResult.data ?? []));
        setStatements(mapStatements(statementsResult.data ?? []));

        const remoteSettings = settingsResult.data;
        if (remoteSettings) {
          setSettings({
            annualReturnRate: mapNumeric(remoteSettings.annual_return_rate),
            inflationRate: mapNumeric(remoteSettings.inflation_rate),
            projectionYears: Number(remoteSettings.projection_years) || 5,
          });
        } else {
          setSettings(DEFAULT_FINANCIAL_SETTINGS);
        }
      } catch (err) {
        console.error("Failed to load financial records", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, supabase, userId]);

  const syncCollection = useCallback(
    async <T extends FinancialItem>(
      table: string,
      prevItems: T[],
      nextItems: T[]
    ) => {
      if (!enabled || !userId) return;
      if (nextItems.length > 0) {
        await supabase.from(table).upsert(
          nextItems.map((item) => ({
            id: item.id,
            user_id: userId,
            description: item.description ?? "",
            amount: item.amount ?? 0,
          }))
        );
      }
      const nextIds = new Set(nextItems.map((item) => item.id));
      const deletions = prevItems
        .map((item) => item.id)
        .filter((id) => !nextIds.has(id));
      if (deletions.length > 0) {
        await supabase.from(table).delete().in("id", deletions);
      }
    },
    [enabled, supabase, userId]
  );

  const createCollectionUpdater = useCallback(
    <T extends FinancialItem>(
      table: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) =>
      (nextItems: T[]) => {
        setter((prev) => {
          if (enabled && userId) {
            syncCollection<T>(table, prev, nextItems).catch((err) =>
              console.error(`Failed to sync ${table}`, err)
            );
          }
          return nextItems;
        });
      },
    [enabled, syncCollection, userId]
  );

  const updateSettings = useCallback(
    (next: FinancialSettings) => {
      setSettings(next);
      if (!enabled || !userId) return;
      supabase
        .from("financial_settings")
        .upsert({
          user_id: userId,
          annual_return_rate: next.annualReturnRate,
          inflation_rate: next.inflationRate,
          projection_years: next.projectionYears,
        })
        .catch((err) => console.error("Failed to sync financial settings", err));
    },
    [enabled, supabase, userId]
  );

  const syncStatements = useCallback(
    async (previousStatements: MonthlyStatement[], nextStatements: MonthlyStatement[]) => {
      if (!enabled || !userId) return;
      if (nextStatements.length > 0) {
        await supabase.from("financial_monthly_statements").upsert(
          nextStatements.map((statement) => ({
            id: statement.id,
            user_id: userId,
            statement_month: statement.month
              ? `${statement.month}-01`
              : null,
            actual_income: statement.income ?? 0,
            actual_expenses: statement.expenses ?? 0,
            notes: statement.notes ?? null,
          }))
        );
      }
      const nextIds = new Set(nextStatements.map((item) => item.id));
      const deletions = previousStatements
        .map((item) => item.id)
        .filter((id) => !nextIds.has(id));
      if (deletions.length > 0) {
        await supabase
          .from("financial_monthly_statements")
          .delete()
          .in("id", deletions);
      }
    },
    [enabled, supabase, userId]
  );

  const updateStatements = useCallback(
    (next: MonthlyStatement[]) => {
      setStatements((prev) => {
        if (enabled && userId) {
          syncStatements(prev, next).catch((err) =>
            console.error("Failed to sync financial monthly statements", err)
          );
        }
        return next;
      });
    },
    [enabled, syncStatements, userId]
  );

  const memoizedValues = useMemo(
    () => ({
      incomes,
      expenses,
      assets,
      liabilities,
      settings,
      statements,
      updateIncomes: createCollectionUpdater<IncomeItem>(
        "financial_incomes",
        setIncomes
      ),
      updateExpenses: createCollectionUpdater<ExpenseItem>(
        "financial_expenses",
        setExpenses
      ),
      updateAssets: createCollectionUpdater<AssetItem>(
        "financial_assets",
        setAssets
      ),
      updateLiabilities: createCollectionUpdater<LiabilityItem>(
        "financial_liabilities",
        setLiabilities
      ),
      updateSettings,
      updateStatements,
      isLoading,
    }),
    [
      assets,
      createCollectionUpdater,
      expenses,
      incomes,
      liabilities,
      settings,
      statements,
      updateSettings,
      updateStatements,
      isLoading,
    ]
  );

  return memoizedValues;
};
