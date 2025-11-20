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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEdit, setTaskEdit] = useState({
    title: "",
    priority: "medium" as Task["priority"],
    scheduledFor: "",
  });

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

  const deleteTask = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }));
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskEdit({
      title: task.title,
      priority: task.priority,
      scheduledFor: task.scheduledFor ?? selectedDay,
    });
  };

  const saveEdit = () => {
    if (!editingTaskId) return;
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: taskEdit.title,
              priority: taskEdit.priority,
              scheduledFor: taskEdit.scheduledFor,
            }
          : task
      ),
    }));
    setEditingTaskId(null);
  };

  const cancelEdit = () => setEditingTaskId(null);

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
                    <div className="flex flex-1 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={task.status === "done"}
                        onChange={() => toggleTask(task)}
                      />
                      {editingTaskId === task.id ? (
                        <div className="flex-1 space-y-2 rounded-2xl border border-slate-200 p-3">
                          <input
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            value={taskEdit.title}
                            onChange={(e) =>
                              setTaskEdit((prev) => ({ ...prev, title: e.target.value }))
                            }
                          />
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <select
                              className="rounded-xl border border-slate-200 px-2 py-1"
                              value={taskEdit.priority}
                              onChange={(e) =>
                                setTaskEdit((prev) => ({
                                  ...prev,
                                  priority: e.target.value as Task["priority"],
                                }))
                              }
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <select
                              className="rounded-xl border border-slate-200 px-2 py-1"
                              value={taskEdit.scheduledFor}
                              onChange={(e) =>
                                setTaskEdit((prev) => ({ ...prev, scheduledFor: e.target.value }))
                              }
                            >
                              {weekDates.map((option) => (
                                <option key={option} value={option}>
                                  {formatDateWithWeekday(option)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <button
                              className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white"
                              onClick={saveEdit}
                            >
                              Save
                            </button>
                            <button
                              className="rounded-full px-3 py-1 text-slate-500"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`font-medium ${
                            task.status === "done" ? "text-emerald-700" : "text-slate-900"
                          }`}
                          onClick={() => startEdit(task)}
                        >
                          {task.title}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
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
                      <button
                        className="rounded-full px-3 py-1 text-xs text-red-500 hover:text-red-600"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
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
