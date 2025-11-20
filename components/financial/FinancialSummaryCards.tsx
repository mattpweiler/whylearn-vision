"use client";

import { formatCurrency } from "./utils";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
}

export const FinancialSummaryCards = ({
  totalIncome,
  totalExpenses,
}: FinancialSummaryCardsProps) => {
  const netCashFlow = totalIncome - totalExpenses;
  const netColor =
    netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Total Monthly Income</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatCurrency(totalIncome)}
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Total Monthly Expenses</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatCurrency(totalExpenses)}
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Net Monthly Cash Flow</p>
        <p className={`mt-1 text-2xl font-semibold ${netColor}`}>
          {formatCurrency(netCashFlow)}
        </p>
      </div>
    </div>
  );
};
