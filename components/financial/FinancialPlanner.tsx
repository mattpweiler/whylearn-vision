"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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
  STATEMENTS_STORAGE_KEY,
  MonthlyStatement,
  StatementLineItem,
} from "@/components/financial/types";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  calculateFreedomScore,
  formatCurrency,
  getFreedomNarrative,
} from "@/components/financial/utils";
import { generateItemId } from "@/components/financial/utils";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useFinancialRecords } from "@/components/financial/useFinancialRecords";
import { TrashIcon } from "@/components/financial/TrashIcon";

const PageSection = ({ children }: { children: ReactNode }) => (
  <section className="space-y-6">{children}</section>
);

const FinancialDisclaimer = () => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
    <p className="font-semibold text-slate-800">Heads up</p>
    <p className="mt-1">
      These tools rely on self-reported data. They are for planning only—nothing here is
      investment, tax, or legal advice.
    </p>
  </div>
);

interface FinancialPlannerProps {
  showIntro?: boolean;
  initialMode?: "projections" | "statements";
  enableModeToggle?: boolean;
  readOnly?: boolean;
}

export const FinancialPlanner = ({
  showIntro = true,
  initialMode = "projections",
  enableModeToggle = true,
  readOnly = false,
}: FinancialPlannerProps) => {
  const { session } = useSupabase();
  const isAuthenticated = Boolean(session);
  const remoteData = useFinancialRecords(isAuthenticated && !readOnly);
  const [activeTab, setActiveTab] = useState<"projections" | "statements">(
    initialMode
  );
  const SAMPLE_INCOMES: IncomeItem[] = [
    { id: "inc1", description: "Salary", amount: 8000, type: "income" },
    { id: "inc2", description: "Freelance", amount: 1200, type: "income" },
    { id: "inc3", description: "Rental income", amount: 700, type: "income" },
  ];
  const SAMPLE_EXPENSES: ExpenseItem[] = [
    { id: "exp1", description: "Housing & utilities", amount: 3200, type: "expense" },
    { id: "exp2", description: "Transportation", amount: 400, type: "expense" },
    { id: "exp3", description: "Groceries & dining", amount: 900, type: "expense" },
    { id: "exp4", description: "Investments", amount: 600, type: "expense" },
  ];
  const SAMPLE_ASSETS: AssetItem[] = [
    { id: "asset1", description: "Cash & savings", amount: 45000, type: "asset" },
    { id: "asset2", description: "Investments", amount: 120000, type: "asset" },
    { id: "asset3", description: "Home equity", amount: 80000, type: "asset" },
  ];
  const SAMPLE_LIABILITIES: LiabilityItem[] = [
    { id: "debt1", description: "Mortgage", amount: 65000, type: "liability" },
    { id: "debt2", description: "Student loan", amount: 14000, type: "liability" },
    { id: "debt3", description: "Auto loan", amount: 8000, type: "liability" },
  ];
  const SAMPLE_STATEMENTS: MonthlyStatement[] = [
    {
      id: "stmt1",
      month: "2024-01",
      income: 9800,
      expenses: 7200,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt2",
      month: "2024-02",
      income: 20100,
      expenses: 7350,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt3",
      month: "2024-03",
      income: 19950,
      expenses: 7100,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt4",
      month: "2024-04",
      income: 10300,
      expenses: 7450,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt5",
      month: "2024-05",
      income: 10420,
      expenses: 7600,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt6",
      month: "2024-06",
      income: 19050,
      expenses: 7400,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt7",
      month: "2024-07",
      income: 22600,
      expenses: 7700,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt8",
      month: "2024-08",
      income: 10850,
      expenses: 7800,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt9",
      month: "2024-09",
      income: 13020,
      expenses: 8050,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt10",
      month: "2024-10",
      income: 11100,
      expenses: 8200,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt11",
      month: "2024-11",
      income: 15350,
      expenses: 8350,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
    {
      id: "stmt12",
      month: "2024-12",
      income: 11500,
      expenses: 8400,
      status: "finalized",
      incomeItems: [],
      expenseItems: [],
    },
  ];

  const [localIncomes, setLocalIncomes] = usePersistentState<IncomeItem[]>(
    INCOME_STORAGE_KEY,
    []
  );
  const [localExpenses, setLocalExpenses] = usePersistentState<ExpenseItem[]>(
    EXPENSE_STORAGE_KEY,
    []
  );
  const [localAssets, setLocalAssets] = usePersistentState<AssetItem[]>(
    ASSET_STORAGE_KEY,
    []
  );
  const [localLiabilities, setLocalLiabilities] =
    usePersistentState<LiabilityItem[]>(
      LIABILITY_STORAGE_KEY,
      []
    );
  const [localSettings, setLocalSettings] = usePersistentState<FinancialSettings>(
    SETTINGS_STORAGE_KEY,
    DEFAULT_FINANCIAL_SETTINGS
  );
  const [localStatements, setLocalStatements] = usePersistentState<
    MonthlyStatement[]
  >(STATEMENTS_STORAGE_KEY, []);

  const incomes = readOnly
    ? SAMPLE_INCOMES
    : isAuthenticated
      ? remoteData.incomes
      : localIncomes;
  const expenses = readOnly
    ? SAMPLE_EXPENSES
    : isAuthenticated
      ? remoteData.expenses
      : localExpenses;
  const assets = readOnly
    ? SAMPLE_ASSETS
    : isAuthenticated
      ? remoteData.assets
      : localAssets;
  const liabilities = readOnly
    ? SAMPLE_LIABILITIES
    : isAuthenticated
      ? remoteData.liabilities
      : localLiabilities;
  const settings = readOnly
    ? { ...DEFAULT_FINANCIAL_SETTINGS, annualReturnRate: 7, inflationRate: 3, projectionYears: 20 }
    : isAuthenticated
      ? remoteData.settings
      : localSettings;
  const statements = readOnly
    ? SAMPLE_STATEMENTS
    : isAuthenticated
      ? remoteData.statements
      : localStatements;

  const noop = () => undefined;
  const handleIncomeChange = readOnly
    ? noop
    : isAuthenticated
      ? remoteData.updateIncomes
      : setLocalIncomes;
  const handleExpenseChange = readOnly
    ? noop
    : isAuthenticated
      ? remoteData.updateExpenses
      : setLocalExpenses;
  const handleAssetChange = readOnly
    ? noop
    : isAuthenticated
      ? remoteData.updateAssets
      : setLocalAssets;
  const handleLiabilityChange = readOnly
    ? noop
    : isAuthenticated
      ? remoteData.updateLiabilities
      : setLocalLiabilities;
  const handleSettingsChange = readOnly
    ? noop
    : isAuthenticated
      ? remoteData.updateSettings
      : setLocalSettings;
  const handleStatementsChange = readOnly
    ? noop
    : isAuthenticated
      ? remoteData.updateStatements
      : setLocalStatements;

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

  if (isAuthenticated && remoteData.isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
        <div className="space-y-2">
          <p>Loading your financial data…</p>
          <p className="text-xs text-slate-500">
            If it seems stuck, email <a className="font-semibold text-slate-900" href="mailto:whylearnwednesdays@gmail.com">whylearnwednesdays@gmail.com</a> and we'll help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FinancialDisclaimer />
      {readOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Read-only preview in demo. Sign in to edit these numbers.
        </div>
      ) : null}

      {enableModeToggle ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "projections", label: "Financial Freedom Projections" },
              { key: "statements", label: "Monthly Profit Statements" },
            ].map((tab) => {
              const active = activeTab === (tab.key as typeof activeTab);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:text-slate-900"
                  } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
                  disabled={readOnly}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "projections" ? (
        <>
          <PageSection>
            <FinancialSummaryCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
            />
          </PageSection>

          <PageSection>
            <div className="grid gap-6 lg:grid-cols-2">
              <IncomeTable
                items={incomes}
                onChange={handleIncomeChange}
                readOnly={readOnly}
              />
              <ExpenseTable
                items={expenses}
                onChange={handleExpenseChange}
                readOnly={readOnly}
              />
            </div>
          </PageSection>

          <PageSection>
            <div className="grid gap-6 lg:grid-cols-2">
              <AssetTable
                items={assets}
                onChange={handleAssetChange}
                readOnly={readOnly}
              />
              <LiabilityTable
                items={liabilities}
                onChange={handleLiabilityChange}
                readOnly={readOnly}
              />
            </div>
          </PageSection>

          <PageSection>
            <NetWorthControls
              settings={settings}
              onChange={handleSettingsChange}
              netCashFlow={netCashFlow}
              netWorth={netWorth}
              readOnly={readOnly}
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
                  <p className="text-sm text-slate-600">
                    {freedomNarrative.label}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Stability (Cashflow)
                    </p>
                    <div className="mt-1 h-2 w-48 rounded-full bg-white/60">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${(freedomScore.stabilityScore / 50) * 100}%`,
                        }}
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
                        style={{
                          width: `${(freedomScore.netWorthScore / 50) * 100}%`,
                        }}
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
        </>
      ) : (
        <MonthlyStatementsSection
          statements={statements}
          onChange={handleStatementsChange}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

interface MonthlyStatementsSectionProps {
  statements: MonthlyStatement[];
  onChange: (next: MonthlyStatement[]) => void;
  readOnly?: boolean;
}

type ChartRange = "3m" | "6m" | "1y" | "all";

const sumItems = (items: StatementLineItem[] = []) =>
  items.reduce((total, item) => total + (item.amount || 0), 0);

const incomeValue = (statement: MonthlyStatement) =>
  statement.incomeItems?.length
    ? sumItems(statement.incomeItems)
    : statement.income ?? 0;

const expenseValue = (statement: MonthlyStatement) =>
  statement.expenseItems?.length
    ? sumItems(statement.expenseItems)
    : statement.expenses ?? 0;

const MonthlyStatementsSection = ({
  statements,
  onChange,
  readOnly = false,
}: MonthlyStatementsSectionProps) => {
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    statements.forEach((statement) => {
      initial[statement.id] = statement.notes ?? "";
    });
    return initial;
  });
  const [visibleSeries, setVisibleSeries] = useState<{
    income: boolean;
    expenses: boolean;
    profit: boolean;
  }>({
    income: true,
    expenses: true,
    profit: true,
  });
  const [chartRange, setChartRange] = useState<ChartRange>("all");
  const [expandedStatements, setExpandedStatements] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    statements.forEach((statement) => {
      initial[statement.id] = false;
    });
    return initial;
  });
  const draftStatements = useMemo(
    () =>
      [...statements]
        .filter((statement) => statement.status === "draft")
        .sort((a, b) => {
          const aKey = a.createdAt ?? a.id;
          const bKey = b.createdAt ?? b.id;
          return bKey.localeCompare(aKey);
        }),
    [statements]
  );
  const finalizedStatements = useMemo(
    () =>
      [...statements].filter((statement) => statement.status !== "draft"),
    [statements]
  );
  const sortedFinalizedAsc = useMemo(
    () => [...finalizedStatements].sort((a, b) => a.month.localeCompare(b.month)),
    [finalizedStatements]
  );
  const sortedFinalizedDesc = useMemo(
    () => [...finalizedStatements].sort((a, b) => b.month.localeCompare(a.month)),
    [finalizedStatements]
  );
  const displayStatements = useMemo(
    () => [...draftStatements, ...sortedFinalizedDesc],
    [draftStatements, sortedFinalizedDesc]
  );
  const chartData = sortedFinalizedAsc
    .filter((statement) => Boolean(statement.month))
    .map((statement) => ({
      month: statement.month,
      label: formatMonthLabel(statement.month),
      income: incomeValue(statement),
      expenses: expenseValue(statement),
      profit: incomeValue(statement) - expenseValue(statement),
    }));
  const filteredChartData = useMemo(() => {
    if (chartRange === "all" || chartData.length === 0) return chartData;
    const monthsToShow = chartRange === "3m" ? 3 : chartRange === "6m" ? 6 : 12;
    const sortedByMonth = [...chartData].sort((a, b) => a.month.localeCompare(b.month));
    const latest = sortedByMonth[sortedByMonth.length - 1];
    const latestDate = monthStringToDate(latest.month);
    if (!latestDate) return chartData;
    const cutoff = new Date(latestDate);
    cutoff.setMonth(cutoff.getMonth() - (monthsToShow - 1));

    return sortedByMonth.filter((item) => {
      const itemDate = monthStringToDate(item.month);
      if (!itemDate) return true;
      return itemDate >= cutoff;
    });
  }, [chartData, chartRange]);

  const handleFieldChange = (
    id: string,
    updates: Partial<MonthlyStatement>
  ) => {
    if (readOnly) return;
    onChange(
      statements.map((statement) =>
        statement.id === id ? { ...statement, ...updates } : statement
      )
    );
  };

  const removeStatement = (id: string) => {
    if (readOnly) return;
    onChange(statements.filter((statement) => statement.id !== id));
  };

  useEffect(() => {
    setNoteDrafts((prev) => {
      const next: Record<string, string> = {};
      statements.forEach((statement) => {
        next[statement.id] =
          prev[statement.id] ?? statement.notes ?? "";
      });
      return next;
    });
  }, [statements]);
  useEffect(() => {
    setExpandedStatements((prev) => {
      const next: Record<string, boolean> = {};
      statements.forEach((statement) => {
        next[statement.id] = prev[statement.id] ?? false;
      });
      return next;
    });
  }, [statements]);

  const handleNoteBlur = (id: string) => {
    const draft = noteDrafts[id] ?? "";
    const current =
      statements.find((statement) => statement.id === id)?.notes ?? "";
    if (draft === current) return;
    handleFieldChange(id, { notes: draft });
  };

  const addStatement = () => {
    if (readOnly) return;
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const newStatement: MonthlyStatement = {
      id: generateItemId(),
      month: defaultMonth,
      income: 0,
      expenses: 0,
      notes: "",
      incomeItems: [],
      expenseItems: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    setExpandedStatements((prev) => ({
      ...prev,
      [newStatement.id]: true,
    }));
    onChange([
      ...statements,
      newStatement,
    ]);
  };

  const updateStatementItems = (
    statementId: string,
    type: StatementLineItem["type"],
    updater: (prev: StatementLineItem[]) => StatementLineItem[]
  ) => {
    if (readOnly) return;
    onChange(
      statements.map((statement) => {
        if (statement.id !== statementId) return statement;
        const key = type === "income" ? "incomeItems" : "expenseItems";
        const nextItems = updater((statement[key] as StatementLineItem[]) ?? []);
        const nextIncome =
          type === "income" ? sumItems(nextItems) : incomeValue(statement);
        const nextExpenses =
          type === "expense" ? sumItems(nextItems) : expenseValue(statement);
        return {
          ...statement,
          [key]: nextItems,
          income: nextIncome,
          expenses: nextExpenses,
        };
      })
    );
  };

  const addStatementItem = (
    statementId: string,
    type: StatementLineItem["type"]
  ) => {
    if (readOnly) return;
    updateStatementItems(statementId, type, (prev) => [
      ...prev,
      {
        id: generateItemId(),
        description: type === "income" ? "New income" : "New expense",
        amount: 0,
        type,
      },
    ]);
  };

  const finalizeStatement = (id: string) => {
    if (readOnly) return;
    onChange(
      statements.map((statement) =>
        statement.id === id
          ? { ...statement, status: "finalized" }
          : statement
      )
    );
  };

  const updateStatementItem = (
    statementId: string,
    itemId: string,
    type: StatementLineItem["type"],
    updates: Partial<StatementLineItem>
  ) => {
    if (readOnly) return;
    updateStatementItems(statementId, type, (prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates, type: item.type } : item
      )
    );
  };

  const removeStatementItem = (
    statementId: string,
    itemId: string,
    type: StatementLineItem["type"]
  ) => {
    if (readOnly) return;
    updateStatementItems(statementId, type, (prev) =>
      prev.filter((item) => item.id !== itemId)
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Revenue and Expense Trend
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs font-semibold sm:flex-row">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "income", label: "Revenue" },
                { key: "expenses", label: "Expenses" },
                { key: "profit", label: "Profit" },
              ].map((series) => {
                const active = visibleSeries[series.key as keyof typeof visibleSeries];
                return (
                  <button
                    key={series.key}
                    type="button"
                    onClick={() =>
                      setVisibleSeries((prev) => ({
                        ...prev,
                        [series.key]: !prev[series.key as keyof typeof prev],
                      }))
                    }
                    className={`rounded-full px-3 py-1 transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {series.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                Range:
              </span>
              {[
                { key: "3m", label: "Last 3 months" },
                { key: "6m", label: "Last 6 months" },
                { key: "1y", label: "Past year" },
                { key: "all", label: "Lifetime" },
              ].map((range) => {
                const active = chartRange === (range.key as ChartRange);
                return (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => setChartRange(range.key as ChartRange)}
                    className={`rounded-full px-3 py-1 transition ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-6 h-72 w-full">
          {filteredChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#475569" fontSize={12} />
                <YAxis
                  stroke="#475569"
                  fontSize={12}
                  tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) =>
                    formatCurrency(Number(value))
                  }
                />
                {visibleSeries.expenses ? (
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Expenses"
                  />
                ) : null}
                {visibleSeries.income ? (
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Revenue"
                  />
                ) : null}
                {visibleSeries.profit ? (
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={{ r: 4 }}
                    name="Profit"
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Start logging monthly statements to visualize spending trends.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Monthly Profit Statements
            </p>
            <p className="text-sm text-slate-500">
              Log actuals to understand the delta between your plan and reality.
            </p>
          </div>
          <button
            type="button"
            onClick={addStatement}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={readOnly}
          >
            + Add month
          </button>
        </div>

        <div className="space-y-4">
          {displayStatements.map((statement) => {
            const incomeItems = statement.incomeItems ?? [];
            const expenseItems = statement.expenseItems ?? [];
            const computedIncome = incomeValue(statement);
            const computedExpenses = expenseValue(statement);
            const netProfit = computedIncome - computedExpenses;
            const noteDraft = noteDrafts[statement.id] ?? "";
            const isExpanded = expandedStatements[statement.id] ?? true;
            const isDraft = statement.status === "draft";
            return (
              <div
                key={statement.id}
                className="space-y-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatMonthLabel(statement.month) || "Monthly statement"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {statement.month || "Set a month to track this period"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Draft
                      </span>
                    ) : null}
                    <span
                      className={`text-sm font-semibold ${
                        netProfit >= 0 ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(netProfit)}
                    </span>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() =>
                        setExpandedStatements((prev) => ({
                          ...prev,
                          [statement.id]: !isExpanded,
                        }))
                      }
                      disabled={readOnly}
                    >
                      {isExpanded ? "Hide details" : "Show details"}
                    </button>
                    {isDraft ? (
                      <button
                        type="button"
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => finalizeStatement(statement.id)}
                        disabled={readOnly}
                      >
                        Finalize month
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full p-2 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => removeStatement(statement.id)}
                      aria-label="Delete monthly statement"
                      disabled={readOnly}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {!isExpanded ? (
                  <div className="text-sm text-slate-600">
                    <p>
                      Revenue: {formatCurrency(computedIncome)} · Expenses:{" "}
                      {formatCurrency(computedExpenses)}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[140px_repeat(3,minmax(0,1fr))]">
                      <label className="min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Month
                        <input
                          type="month"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                          value={statement.month}
                          onChange={(event) =>
                            handleFieldChange(statement.id, {
                              month: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Income
                        <input
                          type="number"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                          value={
                            Number.isFinite(computedIncome) && computedIncome !== 0
                              ? computedIncome
                              : ""
                          }
                          onChange={(event) =>
                            handleFieldChange(statement.id, {
                              income: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label className="min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expenses
                        <input
                          type="number"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                          value={
                            Number.isFinite(computedExpenses) &&
                            computedExpenses !== 0
                              ? computedExpenses
                              : ""
                          }
                          onChange={(event) =>
                            handleFieldChange(statement.id, {
                              expenses: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label className="min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Notes
                        <textarea
                          rows={3}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                          value={noteDraft}
                          onChange={(event) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [statement.id]: event.target.value,
                            }))
                          }
                          onBlur={() => handleNoteBlur(statement.id)}
                          placeholder="Break down key expenses, assumptions, or one-off items for this month."
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Income items
                            </p>
                            <p className="text-xs text-slate-500">
                              Auto-summed into income
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-700">
                              {formatCurrency(computedIncome)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addStatementItem(statement.id, "income")}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              + Add income
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {incomeItems.length > 0 ? (
                            incomeItems.map((item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]"
                              >
                                <input
                                  type="text"
                                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                                  value={item.description}
                                  onChange={(event) =>
                                    updateStatementItem(
                                      statement.id,
                                      item.id,
                                      "income",
                                      { description: event.target.value }
                                    )
                                  }
                                  placeholder="Income source"
                                />
                                <input
                                  type="number"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                                  value={Number.isFinite(item.amount) ? item.amount : ""}
                                  onChange={(event) =>
                                    updateStatementItem(
                                      statement.id,
                                      item.id,
                                      "income",
                                      { amount: Number(event.target.value) || 0 }
                                    )
                                  }
                                  placeholder="$"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeStatementItem(statement.id, item.id, "income")
                                  }
                                  className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                                  aria-label="Delete income item"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                              No income line items yet. Add one to break down this month.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Expense items
                            </p>
                            <p className="text-xs text-slate-500">
                              Auto-summed into expenses
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-rose-600">
                              {formatCurrency(computedExpenses)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addStatementItem(statement.id, "expense")}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              + Add expense
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {expenseItems.length > 0 ? (
                            expenseItems.map((item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]"
                              >
                                <input
                                  type="text"
                                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                                  value={item.description}
                                  onChange={(event) =>
                                    updateStatementItem(
                                      statement.id,
                                      item.id,
                                      "expense",
                                      { description: event.target.value }
                                    )
                                  }
                                  placeholder="Expense item"
                                />
                                <input
                                  type="number"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                                  value={Number.isFinite(item.amount) ? item.amount : ""}
                                  onChange={(event) =>
                                    updateStatementItem(
                                      statement.id,
                                      item.id,
                                      "expense",
                                      { amount: Number(event.target.value) || 0 }
                                    )
                                  }
                                  placeholder="$"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeStatementItem(statement.id, item.id, "expense")
                                  }
                                  className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                                  aria-label="Delete expense item"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                              No expense line items yet. Add one to track this month's spend.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {displayStatements.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              No monthly statements yet. Log a new month to begin tracking how your
              actual spending compares to expectations.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

const formatMonthLabel = (month: string) => {
  if (!month) return "";
  const [year, monthPart] = month.split("-");
  if (!year || !monthPart) return month;
  const date = new Date(Number(year), Number(monthPart) - 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

function monthStringToDate(month: string) {
  if (!month) return null;
  const [year, monthPart] = month.split("-").map(Number);
  if (!year || !monthPart) return null;
  return new Date(year, monthPart - 1, 1);
}
