"use client";

import { FinancialSettings } from "./types";

interface NetWorthControlsProps {
  settings: FinancialSettings;
  onChange: (settings: FinancialSettings) => void;
}

export const NetWorthControls = ({
  settings,
  onChange,
}: NetWorthControlsProps) => {
  const handleNumberChange = (
    key: keyof FinancialSettings,
    value: string
  ) => {
    const numeric = Number(value);
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
            type="number"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            value={settings.currentNetWorth}
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
      </div>

      <div className="mt-4 grid gap-4 md:w-1/2">
        <label className="text-sm font-medium text-slate-600">
          Projection Horizon
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            value={settings.projectionYears}
            onChange={(event) =>
              handleNumberChange("projectionYears", event.target.value)
            }
          >
            <option value={1}>1 Year</option>
            <option value={3}>3 Years</option>
            <option value={5}>5 Years</option>
            <option value={10}>10 Years</option>
          </select>
        </label>
      </div>
    </div>
  );
};
