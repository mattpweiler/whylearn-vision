"use client";

import { useMemo, useState } from "react";
import { AppState } from "@/lib/types";
import {
  formatDateWithWeekday,
  generateId,
  monthKey,
  monthLabel,
  taskEffectiveDate,
} from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const MonthView = ({ state, updateState }: ViewProps) => {
  const now = new Date();
  const key = monthKey(now);
  const currentMonthLabel = monthLabel(now);
  const monthlyReflection = state.reflections.find(
    (ref) => ref.type === "monthly" && ref.content?.month === key
  );

  const [focus, setFocus] = useState(monthlyReflection?.content?.focus ?? "");
  const [newBacklogTitle, setNewBacklogTitle] = useState("");
  const [newBacklogGoalId, setNewBacklogGoalId] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});

  const milestones: string[] = monthlyReflection?.content?.milestones ?? [];

  const goalLookup = useMemo(() => {
    const map: Record<string, string> = {};
    state.goals.forEach((goal) => {
      map[goal.id] = goal.title;
    });
    return map;
  }, [state.goals]);

  const backlogTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => {
          const monthMatch = (task.month ?? currentMonthLabel) === currentMonthLabel;
          const hasSchedule = Boolean(task.scheduledDate) || Boolean(task.scheduledFor);
          const isComplete =
            task.status === "done" || task.status === "completed";
          return monthMatch && !hasSchedule && !isComplete;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [state.tasks, currentMonthLabel]
  );

  const scheduledTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => {
          const scheduled = taskEffectiveDate(task);
          if (!scheduled) return false;
          return scheduled.startsWith(key);
        })
        .sort((a, b) => {
          const aDate = taskEffectiveDate(a) ?? "";
          const bDate = taskEffectiveDate(b) ?? "";
          return aDate.localeCompare(bDate);
        }),
    [state.tasks, key]
  );

  const completedCount = scheduledTasks.filter(
    (task) => task.status === "done" || task.status === "completed"
  ).length;

  const saveFocus = () => {
    const stamp = new Date().toISOString();
    updateState((prev) => {
      const payload = {
        id: monthlyReflection?.id ?? generateId(),
        type: "monthly" as const,
        content: {
          focus,
          milestones,
          month: key,
        },
        createdAt: monthlyReflection?.createdAt ?? stamp,
      };
      const filtered = monthlyReflection
        ? prev.reflections.filter((ref) => ref.id !== monthlyReflection.id)
        : prev.reflections;
      return { ...prev, reflections: [...filtered, payload] };
    });
  };

  const deleteTask = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }));
  };

  const addBacklogTask = () => {
    if (!newBacklogTitle.trim()) return;
    const stamp = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: generateId(),
          title: newBacklogTitle.trim(),
          status: "todo",
          priority: "medium",
          orderIndex: prev.tasks.length + 1,
          goalId: newBacklogGoalId || undefined,
          month: currentMonthLabel,
          scheduledDate: null,
          createdAt: stamp,
        },
      ],
    }));
    setNewBacklogTitle("");
    setNewBacklogGoalId("");
  };

  const updateTaskGoalLink = (taskId: string, goalId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, goalId: goalId || undefined } : task
      ),
    }));
  };

  const scheduleBacklogTask = (taskId: string) => {
    const date = scheduleDrafts[taskId];
    if (!date) return;
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              scheduledDate: date,
              scheduledFor: date,
              month: currentMonthLabel,
            }
          : task
      ),
    }));
    setScheduleDrafts((prev) => ({ ...prev, [taskId]: "" }));
  };

  const unscheduleTask = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? { ...task, scheduledDate: null, scheduledFor: undefined }
          : task
      ),
    }));
  };

  const toggleTaskCompletion = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "done" ? "todo" : "done",
            }
          : task
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold text-slate-900">
            Monthly focus / theme
          </p>
          <textarea
            className="w-full rounded-2xl border border-slate-200 p-3 text-sm"
            rows={3}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="What is this month about?"
          />
          <button
            className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            onClick={saveFocus}
          >
            Save monthly focus
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-slate-900">
            This Month’s Backlog
          </p>
          <p className="text-sm text-slate-500">
            Tasks you want to complete this month but haven’t scheduled yet.
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {backlogTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  {task.goalId ? (
                    <p className="text-xs text-slate-500">
                      Linked goal: {goalLookup[task.goalId]}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">No goal linked</p>
                  )}
                </div>
                <button
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <select
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm lg:w-56"
                  value={task.goalId ?? ""}
                  onChange={(e) => updateTaskGoalLink(task.id, e.target.value)}
                >
                  <option value="">No goal link</option>
                  {state.goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:flex-1">
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                    value={scheduleDrafts[task.id] ?? ""}
                    onChange={(e) =>
                      setScheduleDrafts((prev) => ({
                        ...prev,
                        [task.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    onClick={() => scheduleBacklogTask(task.id)}
                    disabled={!scheduleDrafts[task.id]}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
          {backlogTasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No backlog tasks yet. Capture a few monthly moves below.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Add task for this month…"
            value={newBacklogTitle}
            onChange={(e) => setNewBacklogTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBacklogTask()}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:w-60"
            value={newBacklogGoalId}
            onChange={(e) => setNewBacklogGoalId(e.target.value)}
          >
            <option value="">No goal link</option>
            {state.goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <button
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
            onClick={addBacklogTask}
          >
            Add Task
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-slate-900">
            Scheduled Tasks Overview
          </p>
          <p className="text-sm text-slate-500">
            Tasks scheduled for this month.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Scheduled
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {scheduledTasks.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Completed
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {completedCount}
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {scheduledTasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No tasks scheduled this month.
            </p>
          )}
          {scheduledTasks.map((task) => {
            const scheduledDate = task.scheduledDate ?? task.scheduledFor ?? "";
            const isDone =
              task.status === "done" || task.status === "completed";
            return (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                    {scheduledDate
                      ? formatDateWithWeekday(scheduledDate)
                      : "No date"}
                  </p>
                  {task.goalId && (
                    <p className="text-xs text-slate-500">
                      Linked goal: {goalLookup[task.goalId]}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    className={`rounded-full px-3 py-1 font-semibold ${
                      isDone
                        ? "bg-slate-200 text-slate-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                    onClick={() => toggleTaskCompletion(task.id)}
                  >
                    {isDone ? "Mark pending" : "Mark done"}
                  </button>
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600"
                    onClick={() => unscheduleTask(task.id)}
                  >
                    Move to backlog
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
          })}
        </div>
      </section>
    </div>
  );
};
