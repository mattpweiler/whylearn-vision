"use client";

import { useMemo, useState } from "react";
import { AppState, Task } from "@/lib/types";
import {
  formatDisplayDate,
  generateId,
  todayKey,
} from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const TodayView = ({ state, updateState }: ViewProps) => {
  const today = todayKey();
  const lifeAreaById = useMemo(() => {
    const map: Record<number, string> = {};
    state.lifeAreas.forEach((area) => {
      map[area.id] = area.name;
    });
    return map;
  }, [state.lifeAreas]);

  const todaysTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.scheduledFor === today)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    [state.tasks, today]
  );

  const focus = state.dailyFocus[today] ?? "";
  const [focusDraft, setFocusDraft] = useState(focus);
  const [editingFocus, setEditingFocus] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const saveFocus = () => {
    if (!focusDraft.trim()) return;
    const now = new Date().toISOString();
    updateState((prev) => {
      const nextFocus = { ...prev.dailyFocus, [today]: focusDraft.trim() };
      let reflections = prev.reflections;
      if (!prev.dailyFocus[today]) {
        reflections = [
          ...reflections,
          {
            id: generateId(),
            type: "daily",
            content: { focus: focusDraft.trim(), date: today },
            createdAt: now,
          },
        ];
      }
      return {
        ...prev,
        dailyFocus: nextFocus,
        reflections,
      };
    });
    setEditingFocus(false);
  };

  const toggleTask = (task: Task) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: t.status === "done" ? "todo" : "done",
            }
          : t
      ),
    }));
  };

  const moveToTomorrow = (task: Task) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tz = tomorrow.getTimezoneOffset();
    const local = new Date(tomorrow.getTime() - tz * 60000)
      .toISOString()
      .slice(0, 10);
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              scheduledFor: local,
              status: t.status === "done" ? "todo" : t.status,
            }
          : t
      ),
    }));
  };

  const reorderTasks = (targetIndex: number) => {
    if (!draggingTaskId) return;
    const draggedTask = todaysTasks.find((task) => task.id === draggingTaskId);
    if (!draggedTask) {
      setDraggingTaskId(null);
      return;
    }
    const currentIndex = todaysTasks.findIndex((task) => task.id === draggingTaskId);
    if (currentIndex === targetIndex) {
      setDraggingTaskId(null);
      return;
    }
    const reordered = [...todaysTasks];
    reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, draggedTask);
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        const repositionedIndex = reordered.findIndex((item) => item.id === task.id);
        if (repositionedIndex === -1) return task;
        return { ...task, orderIndex: repositionedIndex + 1 };
      }),
    }));
    setDraggingTaskId(null);
  };

  const addQuickTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
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
          scheduledFor: today,
          createdAt: now,
        },
      ],
    }));
    setNewTaskTitle("");
  };

  const todaysHabits = state.habits.filter(
    (habit) => habit.isActive && habit.cadence === "daily"
  );

  const hasLog = (habitId: string) =>
    state.habitLogs.some(
      (log) => log.habitId === habitId && log.logDate === today && log.completed
    );

  const toggleHabit = (habitId: string) => {
    updateState((prev) => {
      const logs = prev.habitLogs.filter((log) =>
        !(log.habitId === habitId && log.logDate === today)
      );
      const completed = hasLog(habitId);
      if (!completed) {
        logs.push({
          id: generateId(),
          habitId,
          logDate: today,
          completed: true,
          createdAt: new Date().toISOString(),
        });
      }
      return { ...prev, habitLogs: logs };
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-medium text-slate-500">Today’s focus</p>
          {focus && !editingFocus ? (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">{focus}</p>
              <button
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={() => {
                  setFocusDraft(focus);
                  setEditingFocus(true);
                }}
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                value={focusDraft}
                onChange={(e) => setFocusDraft(e.target.value)}
                placeholder="What’s your main focus today?"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
              <button
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                onClick={saveFocus}
              >
                Save today’s focus
              </button>
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-800">
            Tiny momentum tip
          </p>
          <p className="mt-2 text-sm text-emerald-900">
            Your day is defined by what you start before 10am. Ship one small
            win now.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Today’s tasks
            </p>
            <p className="text-sm text-slate-500">
              Keep it short and winnable.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {todaysTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No tasks yet. Add one tiny thing you can do today to move life 1%
              forward.
            </div>
          )}
          {todaysTasks.map((task, index) => {
            const isDone = task.status === "done";
            return (
              <div
                key={task.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${
                  isDone
                    ? "border-emerald-100 bg-emerald-50/70"
                    : "border-slate-100"
                }`}
                draggable
                onDragStart={() => setDraggingTaskId(task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderTasks(index)}
                onDragEnd={() => setDraggingTaskId(null)}
              >
                <label className="flex flex-1 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTask(task)}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        isDone ? "text-emerald-800" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div
                      className={`mt-1 flex flex-wrap gap-2 text-xs ${
                        isDone ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {task.priority && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 capitalize">
                          {task.priority}
                        </span>
                      )}
                      {task.lifeAreaId && (
                        <span className="rounded-full bg-slate-100 px-2 py-1">
                          {lifeAreaById[task.lifeAreaId]}
                        </span>
                      )}
                      {task.dueDate && task.dueDate !== today && (
                        <span className="rounded-full bg-slate-100 px-2 py-1">
                          Due {formatDisplayDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
                <button
                  className={`text-xs font-medium ${
                    isDone ? "text-emerald-700" : "text-slate-500 hover:text-slate-900"
                  }`}
                  onClick={() => moveToTomorrow(task)}
                >
                  Move to tomorrow ↗
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-3">
          <input
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Add a quick task for today…"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
          />
          <button
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            onClick={addQuickTask}
          >
            Add
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Today’s habits</p>
            <p className="text-sm text-slate-500">
              Repeat the boring basics.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {todaysHabits.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              No active daily habits yet.
            </p>
          )}
          {todaysHabits.map((habit) => (
            <label
              key={habit.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{habit.name}</p>
                <p className="text-xs text-slate-500">{habit.description}</p>
              </div>
              <input
                type="checkbox"
                checked={hasLog(habit.id)}
                onChange={() => toggleHabit(habit.id)}
              />
            </label>
          ))}
        </div>
      </section>

      {/* Life areas snapshot removed per latest UX iteration */}
    </div>
  );
};
