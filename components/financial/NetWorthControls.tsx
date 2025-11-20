"use client";

import { FinancialSettings } from "./types";
import { parseAmountInput } from "./utils";

interface NetWorthControlsProps {
  settings: FinancialSettings;
  onChange: (settings: FinancialSettings) => void;
  netCashFlow: number;
}

export const NetWorthControls = ({
  settings,
  onChange,
  netCashFlow,
}: NetWorthControlsProps) => {
  const handleNumberChange = (key: keyof FinancialSettings, value: string) => {
    const numeric = parseAmountInput(value);
    onChange({
      ...settings,
      [key]: Number.isFinite(numeric) ? numeric : 0,
    });
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Net Worth &amp; Projections
      </h3>
      <p className="text-sm text-slate-500">
        Anchor on where you stand today and where you&apos;re heading.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Current Net Worth
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            value={
              Number.isFinite(settings.currentNetWorth) &&
              settings.currentNetWorth !== 0
                ? settings.currentNetWorth.toString()
                : ""
            }
            onChange={(event) =>
              handleNumberChange("currentNetWorth", event.target.value)
            }
          />
        </label>

        <label className="text-sm font-medium text-slate-600">
          Annual Return Rate (%)
          <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <input
              type="range"
              min={-5}
              max={15}
              step={0.5}
              className="flex-1 accent-emerald-500"
              value={settings.annualReturnRate}
              onChange={(event) =>
                handleNumberChange("annualReturnRate", event.target.value)
              }
            />
            <input
              type="number"
              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center outline-none focus:border-slate-400"
              value={settings.annualReturnRate}
              onChange={(event) =>
                handleNumberChange("annualReturnRate", event.target.value)
              }
            />
          </div>
        </label>

        <label className="text-sm font-medium text-slate-600">
          Annual Inflation Rate (%)
          <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <input
              type="range"
              min={0}
              max={10}
              step={0.25}
              className="flex-1 accent-emerald-500"
              value={settings.inflationRate}
              onChange={(event) =>
                handleNumberChange("inflationRate", event.target.value)
              }
            />
            <input
              type="number"
              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center outline-none focus:border-slate-400"
              value={settings.inflationRate}
              onChange={(event) =>
                handleNumberChange("inflationRate", event.target.value)
              }
            />
          </div>
        </label>
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
