"use client";

import { useMemo, useState } from "react";
import { AppState, Goal, PriorityLevel } from "@/lib/types";
import { formatDisplayDate, generateId } from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const defaultGoal = () => ({
  title: "",
  description: "",
  lifeAreaId: "",
  priority: "medium" as PriorityLevel,
  targetDate: "",
  isStarred: false,
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
    lifeAreaId: "",
    priority: "medium" as PriorityLevel,
    targetDate: "",
    isStarred: false,
  });

  const bigThree = state.goals
    .filter((goal) => goal.status === "active" && goal.isStarred)
    .slice(0, 3);

  const taskCounts = useMemo(() => {
    const map: Record<string, number> = {};
    state.tasks.forEach((task) => {
      if (!task.goalId) return;
      map[task.goalId] = (map[task.goalId] ?? 0) + 1;
    });
    return map;
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
      lifeAreaId: form.lifeAreaId ? Number(form.lifeAreaId) : undefined,
      priority: form.priority,
      targetDate: form.targetDate || endOfYear,
      status: "active",
      isStarred: form.isStarred,
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
      lifeAreaId: goal.lifeAreaId ? goal.lifeAreaId.toString() : "",
      priority: goal.priority,
      targetDate: goal.targetDate ?? "",
      isStarred: goal.isStarred,
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
              lifeAreaId: goalEdit.lifeAreaId ? Number(goalEdit.lifeAreaId) : undefined,
              priority: goalEdit.priority,
              targetDate: goalEdit.targetDate || undefined,
              isStarred: goalEdit.isStarred,
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
        <p className="text-lg font-semibold text-slate-900">Big yearly goals</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {bigThree.map((goal) => (
            <div
              key={goal.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-amber-600">
                Starred
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {goal.title}
              </p>
              <p className="text-sm text-slate-600">
                {goal.lifeAreaId ? lifeAreaMap[goal.lifeAreaId] : "Any"}
              </p>
              <p className="text-xs text-slate-500">
                Target {formatDisplayDate(goal.targetDate)}
              </p>
            </div>
          ))}
          {bigThree.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Star your most important goals to show them here.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">All year goals</p>
        <div className="mt-4 space-y-3">
          {state.goals.map((goal) => (
            <details
              key={goal.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
                <span>{goal.title}</span>
                <span className="text-xs font-medium text-slate-500">
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
                        value={goalEdit.lifeAreaId}
                        onChange={(e) =>
                          setGoalEdit((prev) => ({ ...prev, lifeAreaId: e.target.value }))
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
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={goalEdit.isStarred}
                          onChange={(e) =>
                            setGoalEdit((prev) => ({ ...prev, isStarred: e.target.checked }))
                          }
                        />
                        Star goal
                      </label>
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
                    <p className="text-xs text-slate-500">
                      Linked tasks: {taskCounts[goal.id] ?? 0}
                    </p>
                  </>
                )}
                <div className="flex gap-3 text-xs">
                  {editingGoalId !== goal.id && (
                    <button
                      className="font-semibold text-slate-600 hover:text-slate-900"
                      onClick={() => startEdit(goal)}
                    >
                      Edit goal
                    </button>
                  )}
                  <button
                    className="font-semibold text-red-500 hover:text-red-600"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    Delete goal
                  </button>
                </div>
              </div>
            </details>
          ))}
          {state.goals.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No goals yet. Create one to see it here.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">New goal</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Title
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Name your big rock"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Life area
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={form.lifeAreaId}
              onChange={(e) => setForm((prev) => ({ ...prev, lifeAreaId: e.target.value }))}
            >
              <option value="">Any</option>
              {state.lifeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
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
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isStarred}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isStarred: e.target.checked }))
              }
            />
            Star this as one of my Big 3
          </label>
        </div>
        <button
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          onClick={addGoal}
        >
          + New year goal
        </button>
      </section>
    </div>
  );
};
