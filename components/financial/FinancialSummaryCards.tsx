"use client";

import { CurrencyCode } from "@/lib/types";
import { formatCurrency } from "./utils";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  freedomScore: number;
  currency: CurrencyCode;
}

export const FinancialSummaryCards = ({
  totalIncome,
  totalExpenses,
  netWorth,
  freedomScore,
  currency,
}: FinancialSummaryCardsProps) => {
  const netCashFlow = totalIncome - totalExpenses;
  const netColor =
    netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600";
  const netWorthColor =
    netWorth >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Net Worth</p>
        <p className={`mt-1 text-2xl font-semibold ${netWorthColor}`}>
          {formatCurrency(netWorth, currency)}
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Freedom Score</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {Math.round(freedomScore)} / 100
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Total Monthly Income</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {formatCurrency(totalIncome, currency)}
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Net Monthly Cash Flow</p>
        <p className={`mt-1 text-2xl font-semibold ${netColor}`}>
          {formatCurrency(netCashFlow, currency)}
        </p>
      </div>
    </div>
  );
};
