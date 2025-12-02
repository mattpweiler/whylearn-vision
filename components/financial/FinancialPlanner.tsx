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

interface FinancialPlannerProps {
  showIntro?: boolean;
  initialMode?: "projections" | "statements";
  enableModeToggle?: boolean;
}

export const FinancialPlanner = ({
  showIntro = true,
  initialMode = "projections",
  enableModeToggle = true,
}: FinancialPlannerProps) => {
  const { session } = useSupabase();
  const isAuthenticated = Boolean(session);
  const remoteData = useFinancialRecords(isAuthenticated);
  const [activeTab, setActiveTab] = useState<"projections" | "statements">(
    initialMode
  );

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

  const incomes = isAuthenticated ? remoteData.incomes : localIncomes;
  const expenses = isAuthenticated ? remoteData.expenses : localExpenses;
  const assets = isAuthenticated ? remoteData.assets : localAssets;
  const liabilities = isAuthenticated
    ? remoteData.liabilities
    : localLiabilities;
  const settings = isAuthenticated ? remoteData.settings : localSettings;
  const statements = isAuthenticated
    ? remoteData.statements
    : localStatements;

  const handleIncomeChange = isAuthenticated
    ? remoteData.updateIncomes
    : setLocalIncomes;
  const handleExpenseChange = isAuthenticated
    ? remoteData.updateExpenses
    : setLocalExpenses;
  const handleAssetChange = isAuthenticated
    ? remoteData.updateAssets
    : setLocalAssets;
  const handleLiabilityChange = isAuthenticated
    ? remoteData.updateLiabilities
    : setLocalLiabilities;
  const handleSettingsChange = isAuthenticated
    ? remoteData.updateSettings
    : setLocalSettings;
  const handleStatementsChange = isAuthenticated
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
        Loading your financial data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showIntro ? (
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
                  }`}
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
              <IncomeTable items={incomes} onChange={handleIncomeChange} />
              <ExpenseTable items={expenses} onChange={handleExpenseChange} />
            </div>
          </PageSection>

          <PageSection>
            <div className="grid gap-6 lg:grid-cols-2">
              <AssetTable items={assets} onChange={handleAssetChange} />
              <LiabilityTable
                items={liabilities}
                onChange={handleLiabilityChange}
              />
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
        />
      )}
    </div>
  );
};

interface MonthlyStatementsSectionProps {
  statements: MonthlyStatement[];
  onChange: (next: MonthlyStatement[]) => void;
}

const MonthlyStatementsSection = ({
  statements,
  onChange,
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
  const sorted = [...statements].sort((a, b) => a.month.localeCompare(b.month));
  const chartData = sorted
    .filter((statement) => Boolean(statement.month))
    .map((statement) => ({
      month: statement.month,
      label: formatMonthLabel(statement.month),
      income: statement.income ?? 0,
      expenses: statement.expenses ?? 0,
      profit: (statement.income ?? 0) - (statement.expenses ?? 0),
    }));

  const handleFieldChange = (
    id: string,
    updates: Partial<MonthlyStatement>
  ) => {
    onChange(
      statements.map((statement) =>
        statement.id === id ? { ...statement, ...updates } : statement
      )
    );
  };

  const removeStatement = (id: string) => {
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

  const handleNoteBlur = (id: string) => {
    const draft = noteDrafts[id] ?? "";
    const current =
      statements.find((statement) => statement.id === id)?.notes ?? "";
    if (draft === current) return;
    handleFieldChange(id, { notes: draft });
  };

  const addStatement = () => {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    onChange([
      ...statements,
      {
        id: generateItemId(),
        month: defaultMonth,
        income: 0,
        expenses: 0,
        notes: "",
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Expenses Trend
            </p>
            <h3 className="text-2xl font-semibold text-slate-900">
              Monthly spending momentum
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
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
        </div>
        <div className="mt-6 h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            + Add month
          </button>
        </div>

        <div className="space-y-4">
          {sorted.map((statement) => {
            const netProfit = (statement.income ?? 0) - (statement.expenses ?? 0);
            const noteDraft = noteDrafts[statement.id] ?? "";
            return (
              <div
                key={statement.id}
                className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[140px_repeat(3,minmax(0,1fr))]">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Income
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                      value={
                        Number.isFinite(statement.income) && statement.income !== 0
                          ? statement.income
                          : ""
                      }
                      onChange={(event) =>
                        handleFieldChange(statement.id, {
                          income: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Expenses
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                      value={
                        Number.isFinite(statement.expenses) &&
                        statement.expenses !== 0
                          ? statement.expenses
                          : ""
                      }
                      onChange={(event) =>
                        handleFieldChange(statement.id, {
                          expenses: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  <p>
                    Net profit:{" "}
                    <span
                      className={`font-semibold ${
                        netProfit >= 0 ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(netProfit)}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="rounded-full p-2 text-rose-500 transition hover:bg-rose-50"
                    onClick={() => removeStatement(statement.id)}
                    aria-label="Delete monthly statement"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
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
