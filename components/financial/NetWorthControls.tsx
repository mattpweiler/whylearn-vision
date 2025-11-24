"use client";

import { FinancialSettings } from "./types";
import { parseAmountInput } from "./utils";

interface NetWorthControlsProps {
  settings: FinancialSettings;
  onChange: (settings: FinancialSettings) => void;
  netCashFlow: number;
  netWorth: number;
}

export const NetWorthControls = ({
  settings,
  onChange,
  netCashFlow,
  netWorth,
}: NetWorthControlsProps) => {
  const handleNumberChange = (key: keyof FinancialSettings, value: string) => {
    const numeric = parseAmountInput(value);
    onChange({
      ...settings,
      [key]: Number.isFinite(numeric) ? numeric : 0,
    });
  };

  const formattedNetWorth =
    netWorth === 0
      ? "—"
      : Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(netWorth);

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
                : Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(netCashFlow)
            }
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Projection Horizon
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            value={settings.projectionYears}
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
