"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { FinancialSummaryCards } from "@/components/financial/FinancialSummaryCards";
import { IncomeTable, ExpenseTable } from "@/components/financial/BudgetTables";
import { NetWorthControls } from "@/components/financial/NetWorthControls";
import { NetWorthProjectionChart } from "@/components/financial/NetWorthProjectionChart";
import {
  DEFAULT_FINANCIAL_SETTINGS,
  ExpenseItem,
  EXPENSE_STORAGE_KEY,
  FinancialSettings,
  IncomeItem,
  INCOME_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from "@/components/financial/types";
import { usePersistentState } from "@/lib/hooks/usePersistentState";

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
  const netCashFlow = totalIncome - totalExpenses;

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
        <NetWorthControls
          settings={settings}
          onChange={handleSettingsChange}
          netCashFlow={netCashFlow}
        />
        <NetWorthProjectionChart
          currentNetWorth={settings.currentNetWorth}
          annualReturnRate={settings.annualReturnRate}
          projectionYears={settings.projectionYears}
          inflationRate={settings.inflationRate}
          netCashFlow={netCashFlow}
        />
      </PageSection>
    </div>
  );
};
