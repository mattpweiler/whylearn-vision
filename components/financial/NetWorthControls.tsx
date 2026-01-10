"use client";

import { CurrencyCode } from "@/lib/types";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import { FinancialSettings } from "./types";
import { formatCurrency, parseAmountInput } from "./utils";

interface NetWorthControlsProps {
  settings: FinancialSettings;
  onChange: (settings: FinancialSettings) => void;
  netCashFlow: number;
  netWorth: number;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  readOnly?: boolean;
}

export const NetWorthControls = ({
  settings,
  onChange,
  netCashFlow,
  netWorth,
  currency,
  onCurrencyChange,
  readOnly = false,
}: NetWorthControlsProps) => {
  const handleNumberChange = (key: keyof FinancialSettings, value: string) => {
    if (readOnly) return;
    const numeric = parseAmountInput(value);
    onChange({
      ...settings,
      [key]: Number.isFinite(numeric) ? numeric : 0,
    });
  };

  const formattedNetWorth =
    netWorth === 0 ? "—" : formatCurrency(netWorth, currency);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Net Worth &amp; Projections
      </h3>
      <p className="text-sm text-slate-500">
        Anchor on where you stand today and where you&apos;re heading.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600 md:col-span-2">
          Current Net Worth
          <input
            readOnly
            className="mt-1 w-full rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm font-semibold text-emerald-900"
            value={formattedNetWorth}
          />
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
            Calculated from Assets − Liabilities
          </p>
        </label>

        <label className="text-sm font-medium text-slate-600">
          Currency
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            value={currency}
            disabled={readOnly}
            onChange={(event) =>
              onCurrencyChange(event.target.value as CurrencyCode)
            }
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm font-medium text-slate-600 md:col-span-2">
          Annual Assumptions
          <div className="mt-2 flex flex-wrap gap-6 md:gap-10">
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="text-slate-600">Return Rate (%)</span>
              <input
                type="number"
                className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                value={
                  Number.isFinite(settings.annualReturnRate) &&
                  settings.annualReturnRate !== 0
                    ? settings.annualReturnRate
                    : ""
                }
                disabled={readOnly}
                onChange={(event) =>
                  handleNumberChange("annualReturnRate", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="text-slate-600">Inflation Rate (%)</span>
              <input
                type="number"
                className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                value={
                  Number.isFinite(settings.inflationRate) &&
                  settings.inflationRate !== 0
                    ? settings.inflationRate
                    : ""
                }
                disabled={readOnly}
                onChange={(event) =>
                  handleNumberChange("inflationRate", event.target.value)
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Monthly investment (Your Income - Expenses)
          <input
            readOnly
            className="mt-1 w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            value={
              netCashFlow === 0
                ? "—"
                : formatCurrency(netCashFlow, currency)
            }
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Projection Horizon
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            value={settings.projectionYears}
            disabled={readOnly}
            onChange={(event) =>
              handleNumberChange("projectionYears", event.target.value)
            }
          >
            {Array.from({ length: 50 }).map((_, idx) => {
              const years = idx + 1;
              return (
                <option key={years} value={years}>
                  {years} {years === 1 ? "Year" : "Years"}
                </option>
              );
            })}
          </select>
        </label>
      </div>
    </div>
  );
};
