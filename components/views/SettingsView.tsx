"use client";

import { useState } from "react";
import { AppState, ViewKey } from "@/lib/types";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const viewOptions: { key: ViewKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "Year Goals" },
  { key: "direction", label: "Direction" },
  { key: "financial_freedom", label: "Financial Freedom" },
  { key: "financial_profit", label: "Monthly Profit" },
  { key: "next_steps", label: "What are My Next Steps?" },
  { key: "backlog", label: "Backlog" },
  { key: "settings", label: "Settings" },
];

export const SettingsView = ({ state, updateState }: ViewProps) => {
  const [profileDraft, setProfileDraft] = useState(state.profile);

  const saveProfile = () => {
    updateState((prev) => ({ ...prev, profile: profileDraft }));
  };

  const updateSettings = (changes: Partial<AppState["settings"]>) => {
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...changes },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Profile</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Display name
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={profileDraft.displayName}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Timezone
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={profileDraft.timezone}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, timezone: e.target.value }))
                }
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              onClick={saveProfile}
            >
              Save profile
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Preferences</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <label className="block">
              Default home view
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
                value={state.settings.defaultHomeView}
                onChange={(e) =>
                  updateSettings({
                    defaultHomeView: e.target.value as AppState["settings"]["defaultHomeView"],
                  })
                }
              >
                {viewOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Week starts on
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
                value={state.settings.weekStartDay}
                onChange={(e) =>
                  updateSettings({ weekStartDay: Number(e.target.value) as 0 | 1 })
                }
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">
                  Show life area snapshot on Today
                </p>
                <p className="text-xs text-slate-500">
                  Quick reminder of how each area is trending.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.settings.showLifeAreaSummaryOnToday}
                onChange={(e) =>
                  updateSettings({ showLifeAreaSummaryOnToday: e.target.checked })
                }
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
