"use client";

import { useMemo, useState } from "react";
import { AppState, Goal, PriorityLevel } from "@/lib/types";
import {
  formatDisplayDate,
  generateId,
  isTaskCompleted,
} from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const defaultGoal = () => ({
  title: "",
  description: "",
  priority: "medium" as PriorityLevel,
  targetDate: "",
});

export const YearGoalsView = ({ state, updateState }: ViewProps) => {
  const lifeAreaMap = useMemo(() => {
    const map: Record<number, string> = {};
    state.lifeAreas.forEach((area) => {
      map[area.id] = area.name;
    });
    return map;
  }, [state.lifeAreas]);

  const [form, setForm] = useState(defaultGoal());
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalEdit, setGoalEdit] = useState({
    title: "",
    description: "",
    priority: "medium" as PriorityLevel,
    targetDate: "",
  });
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [showGoalTips, setShowGoalTips] = useState(false);

  const priorityBadgeStyles: Record<PriorityLevel, string> = {
    high: "bg-rose-100 text-rose-700 border-rose-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const activeGoals = state.goals.filter((goal) => goal.status === "active");
  const completedGoals = state.goals.filter((goal) => goal.status === "completed");
  const progressTotal = activeGoals.length + completedGoals.length;
  const progressPercent =
    progressTotal === 0 ? 0 : Math.round((completedGoals.length / progressTotal) * 100);

  const taskCounts = useMemo(() => {
    const totals: Record<string, { total: number; done: number }> = {};
    state.tasks.forEach((task) => {
      if (!task.goalId) return;
      if (!totals[task.goalId]) {
        totals[task.goalId] = { total: 0, done: 0 };
      }
      totals[task.goalId].total += 1;
      if (isTaskCompleted(task)) {
        totals[task.goalId].done += 1;
      }
    });
    return totals;
  }, [state.tasks]);

  const addGoal = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    const endOfYear = new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .slice(0, 10);
    const goal: Goal = {
      id: generateId(),
      title: form.title.trim(),
      description: form.description?.trim(),
      priority: form.priority,
      targetDate: form.targetDate || endOfYear,
      status: "active",
      createdAt: now,
    };
    updateState((prev) => ({ ...prev, goals: [goal, ...prev.goals] }));
    setForm(defaultGoal());
  };

  const deleteGoal = (goalId: string) => {
    updateState((prev) => ({
      ...prev,
      goals: prev.goals.filter((goal) => goal.id !== goalId),
      tasks: prev.tasks.map((task) =>
        task.goalId === goalId ? { ...task, goalId: undefined } : task
      ),
    }));
  };

  const startEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setGoalEdit({
      title: goal.title,
      description: goal.description ?? "",
      priority: goal.priority,
      targetDate: goal.targetDate ?? "",
    });
  };

  const saveGoalEdit = () => {
    if (!editingGoalId) return;
    updateState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === editingGoalId
          ? {
              ...goal,
              title: goalEdit.title,
              description: goalEdit.description || undefined,
              priority: goalEdit.priority,
              targetDate: goalEdit.targetDate || undefined,
            }
          : goal
      ),
    }));
    setEditingGoalId(null);
  };

  const cancelGoalEdit = () => setEditingGoalId(null);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-slate-900">Big yearly goals</p>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            onClick={() => setShowGoalTips((prev) => !prev)}
            aria-label="Goal inspiration tips"
          >
            i
          </button>
        </div>
        {showGoalTips && (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Need inspiration?</p>
            <p className="mt-1">
              Think about goals that move different areas of your life forward:{" "}
              <span className="font-medium text-slate-900">
                Financial, Health, Relationships, Career, Personal Growth, and Adventure.
              </span>
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Financial: e.g., “Max out Roth IRA” or “Pay off $10k debt.”</li>
              <li>Health: “Run a half marathon” or “Dial nutrition to 80% whole foods.”</li>
              <li>Social: “Host a monthly meetup” or “Plan a family trip.”</li>
              <li>Personal: “Read 24 books” or “Learn conversational Spanish.”</li>
            </ul>
          <p className="mt-2 text-xs text-slate-500">
            Pick 3–5 quests that feel energizing and measurable for this year.
          </p>
        </div>
        )}
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Completed {completedGoals.length} of {progressTotal || "—"} goals
            </span>
            <span className="font-semibold text-slate-900">{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {activeGoals.map((goal) => {
            const goalStats = taskCounts[goal.id] ?? { total: 0, done: 0 };
            const goalPercent =
              goalStats.total === 0
                ? 0
                : Math.min(100, Math.round((goalStats.done / goalStats.total) * 100));
            return (
              <details
                key={goal.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm cursor-pointer"
              >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
                <span>{goal.title}</span>
                <span
                  className={`text-xs font-semibold border rounded-full px-3 py-1 ${priorityBadgeStyles[goal.priority]}`}
                >
                  {goal.priority.toUpperCase()}
                </span>
              </summary>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {editingGoalId === goal.id ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 p-3">
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={goalEdit.title}
                      onChange={(e) =>
                        setGoalEdit((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                    <textarea
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      rows={2}
                      value={goalEdit.description}
                      onChange={(e) =>
                        setGoalEdit((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                    <div className="grid gap-3 md:grid-cols-2 text-xs text-slate-500">
                      <select
                        className="rounded-xl border border-slate-200 px-2 py-1"
                        value={goalEdit.priority}
                        onChange={(e) =>
                          setGoalEdit((prev) => ({
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
                        className="rounded-xl border border-slate-200 px-2 py-1"
                        value={goalEdit.targetDate}
                        onChange={(e) =>
                          setGoalEdit((prev) => ({ ...prev, targetDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white"
                        onClick={saveGoalEdit}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-full px-3 py-1 text-slate-500"
                        onClick={cancelGoalEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {goal.description && <p>{goal.description}</p>}
                    <p className="text-xs text-slate-500">
                      Life area: {goal.lifeAreaId ? lifeAreaMap[goal.lifeAreaId] : "Any"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Target date: {formatDisplayDate(goal.targetDate)}
                    </p>
                    <div className="rounded-2xl border border-slate-100 bg-white/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Task progress
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {goalStats.done}/{goalStats.total} tasks
                        </span>
                        <span className="font-semibold text-slate-900">
                          {goalPercent}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${goalPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
                {editingGoalId !== goal.id && (
                  <div className="flex gap-3 text-xs">
                    <button
                      className="font-semibold text-slate-600 hover:text-slate-900"
                      onClick={() => startEdit(goal)}
                    >
                      Edit goal
                    </button>
                    <button
                      className="font-semibold text-red-500 hover:text-red-600"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Delete goal
                    </button>
                  </div>
                )}
              </div>
            </details>
          );
          })}
          {state.goals.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No goals yet. Create one to see it here.
            </p>
          )}
        </div>
      </section>

      <button
        className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900 hover:cursor-pointer"
        onClick={() => setShowNewGoalForm((prev) => !prev)}
      >
        {showNewGoalForm ? "Cancel new goal" : "+ New year goal"}
      </button>

      {showNewGoalForm && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">New goal</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Title
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Let's Start on That Dream"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Priority
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as PriorityLevel,
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Target date
              <input
                type="date"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={form.targetDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, targetDate: e.target.value }))
                }
              />
            </label>
            <label className="md:col-span-2 text-sm font-medium text-slate-600">
              Description
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </label>
          </div>
          <button
            className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            onClick={addGoal}
          >
            Create goal
          </button>
        </section>
      )}
    </div>
  );
};
