"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/AppStateProvider";
import { PriorityLevel } from "@/lib/types";
import { generateId, todayKey } from "@/lib/utils";

const questions = [
  {
    key: "displayName",
    label: "What should we call you? (Display name)",
  },
] as const;

type GoalEntry = {
  id: string;
  title: string;
  description: string;
  lifeAreaId: string;
  priority: PriorityLevel;
  targetDate: string;
  isStarred: boolean;
};

type HabitEntry = {
  id: string;
  name: string;
  description: string;
  lifeAreaId: string;
};

const emptyGoalDraft = (): Omit<GoalEntry, "id"> => ({
  title: "",
  description: "",
  lifeAreaId: "",
  priority: "medium",
  targetDate: "",
  isStarred: false,
});

const emptyHabitDraft = (): Omit<HabitEntry, "id"> => ({
  name: "",
  description: "",
  lifeAreaId: "",
});

export const OnboardingFlow = () => {
  const { state, updateState } = useAppState();
  const lifeAreas = useMemo(
    () => [...state.lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder),
    [state.lifeAreas]
  );
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    const defaults: Record<number, number> = {};
    lifeAreas.forEach((area) => {
      defaults[area.id] = 5;
    });
    return defaults;
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);
  const [goalDraft, setGoalDraft] = useState(emptyGoalDraft());
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [habitDraft, setHabitDraft] = useState(emptyHabitDraft());

  const addGoalEntry = () => {
    if (!goalDraft.title.trim()) return;
    setGoalEntries((prev) => [
      ...prev,
      {
        id: generateId(),
        ...goalDraft,
      },
    ]);
    setGoalDraft(emptyGoalDraft());
  };

  const removeGoalEntry = (id: string) => {
    setGoalEntries((prev) => prev.filter((goal) => goal.id !== id));
  };

  const addHabitEntry = () => {
    if (!habitDraft.name.trim()) return;
    setHabitEntries((prev) => [
      ...prev,
      {
        id: generateId(),
        ...habitDraft,
      },
    ]);
    setHabitDraft(emptyHabitDraft());
  };

  const removeHabitEntry = (id: string) => {
    setHabitEntries((prev) => prev.filter((habit) => habit.id !== id));
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const today = todayKey();
    const endOfYear = new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .slice(0, 10);

    updateState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        onboardingCompletedAt: now,
        displayName:
          answers.displayName?.trim() || prev.profile.displayName || "Friend",
      },
      lifeAreaScores: [
        ...prev.lifeAreaScores,
        ...lifeAreas.map((area) => ({
          id: generateId(),
          lifeAreaId: area.id,
          score: ratings[area.id] ?? 5,
          note: "Initial onboarding check-in",
          createdAt: now,
        })),
      ],
      reflections: [
        ...prev.reflections,
        {
          id: generateId(),
          type: "onboarding",
          content: {
            ...answers,
            ratedOn: today,
          },
          createdAt: now,
        },
      ],
      goals: [
        ...prev.goals,
        ...goalEntries.map((goal) => ({
          id: generateId(),
          title: goal.title.trim(),
          description: goal.description?.trim() || undefined,
          lifeAreaId: goal.lifeAreaId ? Number(goal.lifeAreaId) : undefined,
          priority: goal.priority,
          targetDate: goal.targetDate || endOfYear,
          status: "active" as const,
          isStarred: goal.isStarred,
          createdAt: now,
        })),
      ],
      habits: [
        ...prev.habits,
        ...habitEntries.map((habit) => ({
          id: generateId(),
          name: habit.name.trim(),
          description: habit.description?.trim() || undefined,
          lifeAreaId: habit.lifeAreaId ? Number(habit.lifeAreaId) : undefined,
          cadence: "daily" as const,
          frequencyPerPeriod: 1,
          isActive: true,
          createdAt: now,
        })),
      ],
    }));
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-6 text-center max-w-xl">
          <p className="text-3xl font-semibold text-slate-900">
            Welcome to WhyLearn Mentor
          </p>
          <p className="text-lg text-slate-600">
            This app helps you go from “I don’t know what I’m doing” to a clear
            plan for today, this week, this month, and your year guided by your personal AI mentor.
          </p>
          <p className="text-xs text-slate-500">
            By continuing you agree to our
            <a
              href="/privacy"
              className="font-semibold text-slate-900 underline"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            .
          </p>
          <button
            className="w-full rounded-xl bg-slate-900 py-3 text-white"
            onClick={() => setStep(2)}
          >
            Let’s start
          </button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="w-full max-w-2xl space-y-6">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              Rate each life area (1-10)
            </p>
            <p className="text-slate-600">
              Quick gut check so we can tailor your plan.
            </p>
          </div>
          <div className="space-y-4">
            {lifeAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{area.name}</p>
                    <p className="text-sm text-slate-500">
                      How are you doing here?
                    </p>
                  </div>
                  <div className="text-xl font-semibold text-slate-800">
                    {ratings[area.id] ?? 5}/10
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratings[area.id] ?? 5}
                  className="mt-4 w-full"
                  onChange={(e) =>
                    setRatings((prev) => ({
                      ...prev,
                      [area.id]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-4">
            {questions.map((q) => (
              <label key={q.key} className="block">
                <span className="text-sm font-medium text-slate-800">
                  {q.label}
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  value={answers[q.key] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.key]: e.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
              onClick={() => setStep(4)}
            >
              Next: Year goals
            </button>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="w-full max-w-3xl space-y-6">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              Sketch your big yearly goals
            </p>
            <p className="text-slate-600">
              Up to three “big rocks” you care about hitting this year.
            </p>
          </div>
          <div className="space-y-3">
            {goalEntries.map((goal) => {
              const areaName = goal.lifeAreaId
                ? lifeAreas.find((area) => area.id === Number(goal.lifeAreaId))
                    ?.name
                : undefined;
              return (
                <div
                  key={goal.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {goal.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {goal.priority.toUpperCase()} · {areaName ?? "Any area"}
                    </p>
                  </div>
                  <button
                    className="text-sm text-slate-500 hover:text-slate-900"
                    onClick={() => removeGoalEntry(goal.id)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
            {goalEntries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No goals added yet. You can always adjust later.
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Add yearly goal</p>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              placeholder="Title"
              value={goalDraft.title}
              onChange={(e) => setGoalDraft((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              rows={2}
              placeholder="Description (optional)"
              value={goalDraft.description}
              onChange={(e) =>
                setGoalDraft((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={goalDraft.lifeAreaId}
                onChange={(e) =>
                  setGoalDraft((prev) => ({ ...prev, lifeAreaId: e.target.value }))
                }
              >
                <option value="">Any area</option>
                {lifeAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={goalDraft.priority}
                onChange={(e) =>
                  setGoalDraft((prev) => ({
                    ...prev,
                    priority: e.target.value as PriorityLevel,
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={goalDraft.targetDate}
                onChange={(e) =>
                  setGoalDraft((prev) => ({ ...prev, targetDate: e.target.value }))
                }
              />
            </div>
            <button
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              onClick={addGoalEntry}
            >
              + Add goal
            </button>
          </div>
          <div className="flex gap-4">
            <button
              className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700"
              onClick={() => setStep(3)}
            >
              Back
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
              onClick={() => setStep(5)}
            >
              Next: Daily habits
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-3xl space-y-6">
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            Daily habits to reinforce
          </p>
          <p className="text-slate-600">
            Capture the simple reps you want to track every day.
          </p>
        </div>
        <div className="space-y-3">
          {habitEntries.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {habit.name}
                </p>
                <p className="text-xs text-slate-500">
                  {habit.description || "—"}
                </p>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={() => removeHabitEntry(habit.id)}
              >
                Remove
              </button>
            </div>
          ))}
          {habitEntries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No habits yet. Add a couple you want to repeat daily.
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Add daily habit</p>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            placeholder="Habit name"
            value={habitDraft.name}
            onChange={(e) => setHabitDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            rows={2}
            placeholder="Description (optional)"
            value={habitDraft.description}
            onChange={(e) =>
              setHabitDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={habitDraft.lifeAreaId}
            onChange={(e) =>
              setHabitDraft((prev) => ({ ...prev, lifeAreaId: e.target.value }))
            }
          >
            <option value="">Any area</option>
            {lifeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <button
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            onClick={addHabitEntry}
          >
            + Add habit
          </button>
        </div>
        <div className="flex gap-4">
          <button
            className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700"
            onClick={() => setStep(4)}
          >
            Back
          </button>
          <button
            className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
            onClick={handleComplete}
          >
            Finish & launch dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="onboarding-form max-w-4xl rounded-3xl bg-white p-10 shadow-xl">
        {renderStep()}
      </div>
    </div>
  );
};
