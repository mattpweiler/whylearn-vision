"use client";

import { MouseEvent, useMemo, useState } from "react";
import { AppState, Task } from "@/lib/types";
import { generateId, todayKey } from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const TodayView = ({ state, updateState }: ViewProps) => {
  const today = todayKey();
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEdit, setTaskEdit] = useState({
    title: "",
    priority: "medium" as Task["priority"],
    lifeAreaId: "",
    dueDate: "",
  });

  const habitDraftInitial = { name: "", description: "", lifeAreaId: "" };
  const [habitDraft, setHabitDraft] = useState(habitDraftInitial);
  const [showHabitForm, setShowHabitForm] = useState(false);

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

  const handleTaskCardClick = (
    event: MouseEvent<HTMLDivElement>,
    task: Task
  ) => {
    if (editingTaskId === task.id) return;
    const target = event.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea")
    ) {
      return;
    }
    toggleTask(task);
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

  const deleteTask = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
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

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskEdit({
      title: task.title,
      priority: task.priority,
      lifeAreaId: task.lifeAreaId ? task.lifeAreaId.toString() : "",
      dueDate: task.dueDate ?? "",
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
              lifeAreaId: taskEdit.lifeAreaId ? Number(taskEdit.lifeAreaId) : undefined,
              dueDate: taskEdit.dueDate || undefined,
            }
          : task
      ),
    }));
    setEditingTaskId(null);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
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

  const addDailyHabit = () => {
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
          cadence: "daily",
          frequencyPerPeriod: 1,
          isActive: true,
          createdAt: now,
        },
      ],
    }));
    setHabitDraft(habitDraftInitial);
    setShowHabitForm(false);
  };

  const allTasksDone =
    todaysTasks.length > 0 &&
    todaysTasks.every((task) => task.status === "done");
  const allHabitsDone =
    todaysHabits.length > 0 &&
    todaysHabits.every((habit) => hasLog(habit.id));
  const shouldCelebrate = allTasksDone && allHabitsDone;
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);

  const showCelebrationModal = shouldCelebrate && !hasCelebratedToday;

  const dismissCelebration = () => {
    setHasCelebratedToday(true);
  };

  return (
    <div className="space-y-6">
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="text-2xl font-semibold text-slate-900">
              Mission accomplished ✨
            </p>
            <p className="mt-3 text-sm text-slate-600">
              You wrapped every task and habit today. Take a breath, start a
              tiny plan for tomorrow, and enjoy some downtime.
            </p>
            <button
              className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              onClick={dismissCelebration}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
        <div className="mt-6 space-y-2">
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
                className={`flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                  isDone
                    ? "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
                draggable
                onDragStart={() => setDraggingTaskId(task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderTasks(index)}
                onDragEnd={() => setDraggingTaskId(null)}
                onClick={(event) => handleTaskCardClick(event, task)}
              >
                <div className="flex flex-1 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTask(task)}
                  />
                  <div className="w-full">
                    {editingTaskId === task.id ? (
                      <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                        <input
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          value={taskEdit.title}
                          onChange={(e) =>
                            setTaskEdit((prev) => ({ ...prev, title: e.target.value }))
                          }
                        />
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          <select
                            className="rounded-xl border border-slate-200 px-2 py-1 capitalize"
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
                            value={taskEdit.lifeAreaId}
                            onChange={(e) =>
                              setTaskEdit((prev) => ({ ...prev, lifeAreaId: e.target.value }))
                            }
                          >
                            <option value="">Any area</option>
                            {state.lifeAreas.map((area) => (
                              <option key={area.id} value={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            className="rounded-xl border border-slate-200 px-2 py-1"
                            value={taskEdit.dueDate}
                            onChange={(e) =>
                              setTaskEdit((prev) => ({ ...prev, dueDate: e.target.value }))
                            }
                          />
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
                      <div>
                        <p
                          className={`font-medium ${
                            isDone ? "text-emerald-800" : "text-slate-900"
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 text-xs font-medium text-slate-500">
                  {editingTaskId !== task.id && (
                    <button
                      className="rounded-full px-3 py-1 text-slate-500 hover:text-slate-900"
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className={`rounded-full px-3 py-1 ${
                      isDone ? "text-emerald-700" : "hover:text-slate-900"
                    }`}
                    onClick={() => moveToTomorrow(task)}
                  >
                    Move to tomorrow ↗
                  </button>
                  <button
                    className="rounded-full px-3 py-1 text-red-500 hover:text-red-600"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
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
          {todaysHabits.map((habit) => {
            const completed = hasLog(habit.id);
            return (
              <label
                key={habit.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                  completed
                    ? "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-emerald-500"
                  checked={completed}
                  onChange={() => toggleHabit(habit.id)}
                />
                <div className="text-left">
                  <p
                    className={`font-medium ${
                      completed ? "text-emerald-800" : "text-slate-900"
                    }`}
                  >
                    {habit.name}
                  </p>
                  <p className="text-xs text-slate-500">{habit.description}</p>
                </div>
              </label>
            );
          })}
          {showHabitForm ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Add a daily habit
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  onClick={() => {
                    setShowHabitForm(false);
                    setHabitDraft(habitDraftInitial);
                  }}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 space-y-3 text-sm">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="Habit name"
                  value={habitDraft.name}
                  onChange={(e) =>
                    setHabitDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="Why it matters"
                  rows={2}
                  value={habitDraft.description}
                  onChange={(e) =>
                    setHabitDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={habitDraft.lifeAreaId}
                  onChange={(e) =>
                    setHabitDraft((prev) => ({
                      ...prev,
                      lifeAreaId: e.target.value,
                    }))
                  }
                >
                  <option value="">Any life area</option>
                  {state.lifeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <button
                  className="w-full rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={addDailyHabit}
                  disabled={!habitDraft.name.trim()}
                >
                  Save daily habit
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setShowHabitForm(true)}
            >
              + Add a daily habit
            </button>
          )}
        </div>
      </section>

      {/* Life areas snapshot removed per latest UX iteration */}
    </div>
  );
};
