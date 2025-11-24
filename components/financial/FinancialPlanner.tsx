"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { FinancialSummaryCards } from "@/components/financial/FinancialSummaryCards";
import {
  IncomeTable,
  ExpenseTable,
  AssetTable,
  LiabilityTable,
} from "@/components/financial/BudgetTables";
import { NetWorthControls } from "@/components/financial/NetWorthControls";
import { NetWorthProjectionChart } from "@/components/financial/NetWorthProjectionChart";
import {
  DEFAULT_FINANCIAL_SETTINGS,
  ExpenseItem,
  AssetItem,
  LiabilityItem,
  EXPENSE_STORAGE_KEY,
  FinancialSettings,
  IncomeItem,
  INCOME_STORAGE_KEY,
  ASSET_STORAGE_KEY,
  LIABILITY_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from "@/components/financial/types";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  calculateFreedomScore,
  getFreedomNarrative,
} from "@/components/financial/utils";

const PageSection = ({ children }: { children: ReactNode }) => (
  <section className="space-y-6">{children}</section>
);

interface FinancialPlannerProps {
  showIntro?: boolean;
}

export const FinancialPlanner = ({ showIntro = true }: FinancialPlannerProps) => {
  const [incomes, setIncomes] = usePersistentState<IncomeItem[]>(
    INCOME_STORAGE_KEY,
    []
  );
  const [expenses, setExpenses] = usePersistentState<ExpenseItem[]>(
    EXPENSE_STORAGE_KEY,
    []
  );
  const [assets, setAssets] = usePersistentState<AssetItem[]>(
    ASSET_STORAGE_KEY,
    []
  );
  const [liabilities, setLiabilities] = usePersistentState<LiabilityItem[]>(
    LIABILITY_STORAGE_KEY,
    []
  );
  const [settings, setSettings] = usePersistentState<FinancialSettings>(
    SETTINGS_STORAGE_KEY,
    DEFAULT_FINANCIAL_SETTINGS
  );

  const handleIncomeChange = useCallback(
    (next: IncomeItem[]) => setIncomes(next),
    [setIncomes]
  );
  const handleExpenseChange = useCallback(
    (next: ExpenseItem[]) => setExpenses(next),
    [setExpenses]
  );
  const handleAssetChange = useCallback(
    (next: AssetItem[]) => setAssets(next),
    [setAssets]
  );
  const handleLiabilityChange = useCallback(
    (next: LiabilityItem[]) => setLiabilities(next),
    [setLiabilities]
  );
  const handleSettingsChange = useCallback(
    (next: FinancialSettings) => setSettings(next),
    [setSettings]
  );

  const totalIncome = useMemo(
    () => incomes.reduce((sum, item) => sum + (item.amount || 0), 0),
    [incomes]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + (item.amount || 0), 0),
    [expenses]
  );
  const totalAssets = useMemo(
    () => assets.reduce((sum, item) => sum + (item.amount || 0), 0),
    [assets]
  );
  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, item) => sum + (item.amount || 0), 0),
    [liabilities]
  );
  const netCashFlow = totalIncome - totalExpenses;
  const netWorth = totalAssets - totalLiabilities;
  const freedomScore = calculateFreedomScore({
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpenses,
    totalAssets,
    totalLiabilities,
  });
  const freedomNarrative = getFreedomNarrative(freedomScore.score);


  return (
    <div className="space-y-6">
      {showIntro && (
        <header className="mb-2 space-y-2 text-center">
          <p className="text-sm uppercase tracking-wide text-emerald-500">
            WhyLearn Labs
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Financial Planner
          </h1>
          <p className="text-base text-slate-500 md:text-lg">
            Track your monthly cash flow, update your net worth, and visualize
            the compounding effect of your habits.
          </p>
        </header>
      )}

      <PageSection>
        <FinancialSummaryCards
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />
      </PageSection>

      <PageSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeTable items={incomes} onChange={handleIncomeChange} />
          <ExpenseTable items={expenses} onChange={handleExpenseChange} />
        </div>
      </PageSection>

      <PageSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <AssetTable items={assets} onChange={handleAssetChange} />
          <LiabilityTable items={liabilities} onChange={handleLiabilityChange} />
        </div>
      </PageSection>

      <PageSection>
        <NetWorthControls
          settings={settings}
          onChange={handleSettingsChange}
          netCashFlow={netCashFlow}
          netWorth={netWorth}
        />
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-slate-900 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Freedom Score
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {freedomScore.score}/100
              </p>
              <p className="text-sm text-slate-600">{freedomNarrative.label}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Stability (Cashflow)
                </p>
                <div className="mt-1 h-2 w-48 rounded-full bg-white/60">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(freedomScore.stabilityScore / 50) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {freedomScore.stabilityScore}/50
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Net Worth Strength
                </p>
                <div className="mt-1 h-2 w-48 rounded-full bg-white/60">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${(freedomScore.netWorthScore / 50) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {freedomScore.netWorthScore}/50
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>{freedomNarrative.description}</p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Suggested Moves
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                {freedomNarrative.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <NetWorthProjectionChart
          currentNetWorth={netWorth}
          annualReturnRate={settings.annualReturnRate}
          projectionYears={settings.projectionYears}
          inflationRate={settings.inflationRate}
          netCashFlow={netCashFlow}
        />
      </PageSection>
    </div>
  );
};
