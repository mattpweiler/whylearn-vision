"use client";

import { useMemo, useState } from "react";
import { AppState } from "@/lib/types";
import { generateId, monthLabel } from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const nowMonth = () => monthLabel(new Date());

export const BacklogView = ({ state, updateState }: ViewProps) => {
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");

  const goalLookup = useMemo(() => {
    const map: Record<string, string> = {};
    state.goals.forEach((goal) => {
      map[goal.id] = goal.title;
    });
    return map;
  }, [state.goals]);

  const backlogTasks = useMemo(() => {
    const list = state.tasks.filter((task) => {
      const hasSchedule = Boolean(task.scheduledDate) || Boolean(task.scheduledFor);
      return !hasSchedule;
    });
    return list.sort((a, b) => {
      const aDue = a.dueDate ?? "";
      const bDue = b.dueDate ?? "";
      if (aDue && bDue) return aDue.localeCompare(bDue);
      if (aDue) return -1;
      if (bDue) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [state.tasks]);

  const totalCompleted = backlogTasks.filter(
    (task) => task.status === "done" || task.status === "completed"
  ).length;

  const addTask = () => {
    if (!title.trim()) return;
    const stamp = new Date().toISOString();
    const monthTag = dueDate ? monthLabel(new Date(dueDate)) : nowMonth();
    updateState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: generateId(),
          title: title.trim(),
          status: "pending",
          priority: "medium",
          goalId: goalId || undefined,
          backlogCategory: category || undefined,
          dueDate: dueDate || undefined,
          month: monthTag,
          orderIndex: prev.tasks.length + 1,
          createdAt: stamp,
        },
      ],
    }));
    setTitle("");
    setGoalId("");
    setCategory("");
    setDueDate("");
  };

  const updateTask = (taskId: string, updates: Record<string, unknown>) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  };

  const toggleComplete = (taskId: string) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextStatus =
      task.status === "done" || task.status === "completed" ? "pending" : "completed";
    updateTask(taskId, { status: nextStatus });
  };

  const deleteTask = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold text-slate-900">Backlog capture</p>
          <p className="text-sm text-slate-500">
            Drop ideas, maintenance items, or project moves you&apos;ll schedule later.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
            placeholder="Capture backlog task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">No goal link</option>
            {state.goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Area / category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            type="date"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white md:col-span-2"
            onClick={addTask}
          >
            Add to backlog
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total tasks
            </p>
            <p className="text-3xl font-semibold text-slate-900">{backlogTasks.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Completed
            </p>
            <p className="text-3xl font-semibold text-slate-900">{totalCompleted}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {backlogTasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Nothing in the backlog yet. Capture a few above.
            </p>
          ) : (
            backlogTasks.map((task) => {
              const isDone =
                task.status === "done" || task.status === "completed";
              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p
                      className={`font-semibold ${
                        isDone ? "text-emerald-600 line-through" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {task.dueDate ? `Due ${task.dueDate}` : "No due date"}
                    </p>
                    {task.goalId && (
                      <p className="text-xs text-slate-500">
                        Linked goal: {goalLookup[task.goalId]}
                      </p>
                    )}
                    {task.backlogCategory && (
                      <p className="text-xs text-slate-500">
                        Area: {task.backlogCategory}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <input
                      type="date"
                      className="rounded-xl border border-slate-200 px-3 py-1 text-sm"
                      value={task.dueDate ?? ""}
                      onChange={(e) =>
                        updateTask(task.id, {
                          dueDate: e.target.value || undefined,
                          month: e.target.value
                            ? monthLabel(new Date(e.target.value))
                            : task.month ?? nowMonth(),
                        })
                      }
                    />
                    <select
                      className="rounded-xl border border-slate-200 px-3 py-1 text-sm"
                      value={task.goalId ?? ""}
                      onChange={(e) => updateTask(task.id, { goalId: e.target.value || undefined })}
                    >
                      <option value="">Goal link</option>
                      {state.goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                    <button
                      className={`rounded-full px-3 py-1 font-semibold ${
                        isDone ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                      onClick={() => toggleComplete(task.id)}
                    >
                      {isDone ? "Mark pending" : "Mark done"}
                    </button>
                    <button
                      className="rounded-full px-3 py-1 font-semibold text-red-500"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
