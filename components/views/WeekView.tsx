"use client";

import { useMemo, useState } from "react";
import { AppState, Task } from "@/lib/types";
import {
  endOfWeek,
  formatDisplayDate,
  formatDateKey,
  formatDateWithWeekday,
  generateId,
  startOfWeek,
  tasksByDateWithinRange,
  todayKey,
  weekDateKeys,
} from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const WeekView = ({ state, updateState }: ViewProps) => {
  const weekStartDate = startOfWeek(
    new Date(),
    state.settings.weekStartDay ?? 1
  );
  const weekEndDate = endOfWeek(new Date(), state.settings.weekStartDay ?? 1);
  const weekStartKey = formatDateKey(weekStartDate);
  const weekDates = weekDateKeys(new Date(), state.settings.weekStartDay ?? 1);
  const weeklyReflection = useMemo(
    () =>
      state.reflections.find(
        (ref) => ref.type === "weekly" && ref.content?.weekStart === weekStartKey
      ),
    [state.reflections, weekStartKey]
  );
  const [intent, setIntent] = useState(
    weeklyReflection?.content?.intent ?? ""
  );
  const [priorities, setPriorities] = useState<string[]>(
    weeklyReflection?.content?.priorities ?? ["", "", ""]
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const groupedTasks = useMemo(
    () =>
      tasksByDateWithinRange(
        state.tasks,
        formatDateKey(weekStartDate),
        formatDateKey(weekEndDate)
      ),
    [state.tasks, weekStartDate, weekEndDate]
  );

  const saveWeeklyPlan = () => {
    const now = new Date().toISOString();
    updateState((prev) => {
      const next = {
        id: weeklyReflection?.id ?? generateId(),
        type: "weekly" as const,
        content: {
          intent,
          priorities,
          weekStart: weekStartKey,
        },
        createdAt: weeklyReflection?.createdAt ?? now,
      };
      const filtered = weeklyReflection
        ? prev.reflections.filter((ref) => ref.id !== weeklyReflection.id)
        : prev.reflections;
      return {
        ...prev,
        reflections: [...filtered, next],
      };
    });
  };

  const toggleTask = (task: Task) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: t.status === "done" ? "todo" : "done" }
          : t
      ),
    }));
  };

  const changeTaskDay = (task: Task, day: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              scheduledFor: day,
            }
          : t
      ),
    }));
  };

  const addWeeklyTask = () => {
    const title = newTaskTitle.trim();
    if (!title || !selectedDay) return;
    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: generateId(),
          title,
          status: "todo",
          priority: "medium",
          orderIndex: prev.tasks.length + 1,
          scheduledFor: selectedDay,
          createdAt: now,
        },
      ],
    }));
    setNewTaskTitle("");
  };

  const handleDrop = (dateKey: string) => {
    if (!draggingTaskId) return;
    const task = state.tasks.find((t) => t.id === draggingTaskId);
    if (!task || task.scheduledFor === dateKey) {
      setDraggingTaskId(null);
      return;
    }
    changeTaskDay(task, dateKey);
    setDraggingTaskId(null);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Weekly intent / theme
          </p>
          <textarea
            className="mt-3 w-full rounded-2xl border border-slate-200 p-3 text-sm"
            rows={3}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="What’s the main theme or intention for this week?"
          />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Top 3 priorities</p>
          <div className="mt-4 space-y-3">
            {priorities.map((priority, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-500">
                  {idx + 1}.
                </span>
                <input
                  className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g., Apply to 5 jobs"
                  value={priority}
                  onChange={(e) =>
                    setPriorities((prev) => {
                      const copy = [...prev];
                      copy[idx] = e.target.value;
                      return copy;
                    })
                  }
                />
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            onClick={saveWeeklyPlan}
          >
            Save weekly plan
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            This week’s tasks
          </p>
          <p className="text-sm text-slate-500">
            Scheduled from {formatDisplayDate(formatDateKey(weekStartDate))} to {" "}
            {formatDisplayDate(formatDateKey(weekEndDate))}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {weekDates.map((dateKey) => (
            <div key={dateKey}>
              <p className="text-sm font-semibold text-slate-500">
                {formatDateWithWeekday(dateKey)}
              </p>
              <div
                className={`mt-2 space-y-2 rounded-2xl border border-transparent p-2 ${
                  draggingTaskId ? "border-dashed border-emerald-200 bg-emerald-50/40" : ""
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(dateKey)}
              >
                {(groupedTasks[dateKey] ?? []).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 p-4"
                    draggable
                    onDragStart={() => setDraggingTaskId(task.id)}
                    onDragEnd={() => setDraggingTaskId(null)}
                  >
                    <label className="flex flex-1 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={task.status === "done"}
                        onChange={() => toggleTask(task)}
                      />
                      <span className="font-medium text-slate-900">
                        {task.title}
                      </span>
                    </label>
                    <select
                      value={task.scheduledFor}
                      onChange={(e) => changeTaskDay(task, e.target.value)}
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      {weekDates.map((option) => (
                        <option key={option} value={option}>
                          {formatDateWithWeekday(option)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {(groupedTasks[dateKey] ?? []).length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                    Nothing planned yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">Pick a day</option>
            {weekDates.map((date) => (
              <option key={date} value={date}>
                {formatDateWithWeekday(date)}
              </option>
            ))}
          </select>
          <input
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Add task for this week"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWeeklyTask()}
          />
          <button
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            onClick={addWeeklyTask}
          >
            Add
          </button>
        </div>
      </section>
    </div>
  );
};
