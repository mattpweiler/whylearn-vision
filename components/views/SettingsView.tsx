"use client";

import { useMemo, useState } from "react";
import { AppState, HabitCadence, ViewKey } from "@/lib/types";
import { generateId } from "@/lib/utils";

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
  { key: "financial", label: "Financial Planner" },
];

export const SettingsView = ({ state, updateState }: ViewProps) => {
  const [profileDraft, setProfileDraft] = useState(state.profile);
  const habitDraftInitial = {
    name: "",
    description: "",
    lifeAreaId: "",
    cadence: "daily" as HabitCadence,
  };
  const [habitDraft, setHabitDraft] = useState(habitDraftInitial);

  const habitsByCadence = useMemo(
    () => ({
      daily: state.habits.filter((habit) => habit.cadence === "daily"),
      weekly: state.habits.filter((habit) => habit.cadence === "weekly"),
      monthly: state.habits.filter((habit) => habit.cadence === "monthly"),
    }),
    [state.habits]
  );

  const saveProfile = () => {
    updateState((prev) => ({ ...prev, profile: profileDraft }));
  };

  const updateSettings = (changes: Partial<AppState["settings"]>) => {
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...changes },
    }));
  };

  const updateHabit = (
    habitId: string,
    changes: Partial<{
      name: string;
      description?: string;
      lifeAreaId?: number;
      cadence: HabitCadence;
      isActive: boolean;
    }>
  ) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) =>
        habit.id === habitId ? { ...habit, ...changes } : habit
      ),
    }));
  };

  const removeHabit = (habitId: string) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.filter((habit) => habit.id !== habitId),
      habitLogs: prev.habitLogs.filter((log) => log.habitId !== habitId),
    }));
  };

  const addHabit = () => {
    if (!habitDraft.name.trim()) return;
    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: generateId(),
          name: habitDraft.name.trim(),
          description: habitDraft.description?.trim() || undefined,
          lifeAreaId: habitDraft.lifeAreaId
            ? Number(habitDraft.lifeAreaId)
            : undefined,
          cadence: habitDraft.cadence,
          frequencyPerPeriod: habitDraft.cadence === "daily" ? 1 : undefined,
          isActive: true,
          createdAt: now,
        },
      ],
    }));
    setHabitDraft(habitDraftInitial);
  };

  const cadenceSections: Array<{ key: HabitCadence; label: string }> = [
    { key: "daily", label: "Daily habits" },
    { key: "weekly", label: "Weekly habits" },
    { key: "monthly", label: "Monthly habits" },
  ];

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
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">
                  Auto-generate tasks from AI
                </p>
                <p className="text-xs text-slate-500">Future feature placeholder.</p>
              </div>
              <input
                type="checkbox"
                checked={state.settings.autoGenerateTasksFromAi}
                onChange={(e) =>
                  updateSettings({ autoGenerateTasksFromAi: e.target.checked })
                }
              />
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Habits</p>
        <p className="text-sm text-slate-500">
          Manage the daily, weekly, and monthly habits you want WhyLearn to track.
        </p>
        <div className="mt-4 space-y-6">
          {cadenceSections.map((section) => (
            <div key={section.key} className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">{section.label}</p>
              {habitsByCadence[section.key].map((habit) => (
                <div
                  key={habit.id}
                  className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={habit.name}
                    onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                  />
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    rows={2}
                    value={habit.description ?? ""}
                    onChange={(e) =>
                      updateHabit(habit.id, { description: e.target.value })
                    }
                  />
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <select
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                      value={habit.lifeAreaId ? habit.lifeAreaId.toString() : ""}
                      onChange={(e) =>
                        updateHabit(habit.id, {
                          lifeAreaId: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    >
                      <option value="">Any area</option>
                      {state.lifeAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-xl border border-slate-200 px-3 py-2"
                      value={habit.cadence}
                      onChange={(e) =>
                        updateHabit(habit.id, { cadence: e.target.value as HabitCadence })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={habit.isActive}
                        onChange={(e) =>
                          updateHabit(habit.id, { isActive: e.target.checked })
                        }
                      />
                      Active
                    </label>
                    <button
                      className="text-xs font-medium text-red-500"
                      onClick={() => removeHabit(habit.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {habitsByCadence[section.key].length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No {section.label.toLowerCase()} yet.
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Add habit</p>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Habit name"
            value={habitDraft.name}
            onChange={(e) => setHabitDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            rows={2}
            placeholder="Description (optional)"
            value={habitDraft.description}
            onChange={(e) =>
              setHabitDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <div className="space-y-3 text-sm text-slate-600">
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={habitDraft.lifeAreaId}
              onChange={(e) =>
                setHabitDraft((prev) => ({ ...prev, lifeAreaId: e.target.value }))
              }
            >
              <option value="">Any area</option>
              {state.lifeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={habitDraft.cadence}
              onChange={(e) =>
                setHabitDraft((prev) => ({
                  ...prev,
                  cadence: e.target.value as HabitCadence,
                }))
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            onClick={addHabit}
          >
            + Add habit
          </button>
        </div>
      </section>
    </div>
  );
};
