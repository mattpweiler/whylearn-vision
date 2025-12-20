"use client";

import { MouseEvent, useMemo, useState } from "react";
import { AppState, Task } from "@/lib/types";
import { todayKey, taskEffectiveDate, isTaskCompleted, generateId } from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const TodayView = ({ state, updateState }: ViewProps) => {
  const today = todayKey();
  const todaysTasks = useMemo(() => {
    const tasksForToday = state.tasks.filter(
      (task) => taskEffectiveDate(task) === today
    );
    return tasksForToday.sort((a, b) => a.orderIndex - b.orderIndex);
  }, [state.tasks, today]);
  const orderedTodaysTasks = useMemo(() => {
    const pending = todaysTasks.filter((task) => !isTaskCompleted(task));
    const done = todaysTasks.filter((task) => isTaskCompleted(task));
    return [...pending, ...done];
  }, [todaysTasks]);

  const focus = state.dailyFocus[today] ?? "";
  const [focusDraft, setFocusDraft] = useState(focus);
  const [editingFocus, setEditingFocus] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEdit, setTaskEdit] = useState({
    title: "",
  });
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);

  const habitDraftInitial = { name: "", description: "", lifeAreaId: "" };
  const [habitDraft, setHabitDraft] = useState(habitDraftInitial);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [showHabitForm, setShowHabitForm] = useState(false);

  const saveFocus = () => {
    if (!focusDraft.trim()) return;
    updateState((prev) => {
      const nextFocus = { ...prev.dailyFocus, [today]: focusDraft.trim() };
      return {
        ...prev,
        dailyFocus: nextFocus,
      };
    });
    setEditingFocus(false);
  };

  const toggleTask = (task: Task) => {
    if (isTaskCompleted(task)) {
      setCelebrationDay(null);
    }
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: isTaskCompleted(t) ? "todo" : "done",
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
      target.closest("textarea") ||
      target.closest("details")
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
              scheduledDate: local,
              status: isTaskCompleted(t) ? "todo" : t.status,
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
          scheduledDate: today,
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
              priority: task.priority,
              lifeAreaId: task.lifeAreaId,
              dueDate: task.dueDate,
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
    const completed = hasLog(habitId);
    if (completed) {
      setCelebrationDay(null);
    }
    updateState((prev) => {
      const logs = prev.habitLogs.filter((log) =>
        !(log.habitId === habitId && log.logDate === today)
      );
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

  const updateDailyHabit = (
    habitId: string,
    changes: Partial<{ name: string; description?: string; lifeAreaId?: number }>
  ) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) =>
        habit.id === habitId ? { ...habit, ...changes } : habit
      ),
    }));
  };

  const removeDailyHabit = (habitId: string) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.filter((habit) => habit.id !== habitId),
      habitLogs: prev.habitLogs.filter((log) => log.habitId !== habitId),
    }));
    if (editingHabitId === habitId) {
      setEditingHabitId(null);
      setEditingHabitName("");
    }
  };

  const addDailyHabit = () => {
    if (!habitDraft.name.trim()) return;
    const payload = {
      name: habitDraft.name.trim(),
      description: habitDraft.description?.trim() || undefined,
      lifeAreaId: habitDraft.lifeAreaId
        ? Number(habitDraft.lifeAreaId)
        : undefined,
    };

    if (editingHabitId) {
      updateDailyHabit(editingHabitId, payload);
      setEditingHabitId(null);
    } else {
      const now = new Date().toISOString();
      updateState((prev) => ({
        ...prev,
        habits: [
          ...prev.habits,
          {
            id: generateId(),
            ...payload,
            cadence: "daily",
            frequencyPerPeriod: 1,
            isActive: true,
            createdAt: now,
          },
        ],
      }));
    }

    setHabitDraft(habitDraftInitial);
    setShowHabitForm(false);
    setEditingHabitId(null);
    setEditingHabitName("");
  };

  const startHabitEdit = (habit: typeof todaysHabits[number]) => {
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.name);
  };

  const cancelHabitEdit = () => {
    setEditingHabitId(null);
    setEditingHabitName("");
  };

  const saveHabitEdit = () => {
    if (!editingHabitId || !editingHabitName.trim()) return;
    updateDailyHabit(editingHabitId, { name: editingHabitName.trim() });
    cancelHabitEdit();
  };

  const handleHabitCardClick = (
    event: MouseEvent<HTMLDivElement>,
    habitId: string
  ) => {
    if (editingHabitId === habitId) return;
    const target = event.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("details")
    ) {
      return;
    }
    toggleHabit(habitId);
  };

  const totalFocusItems = todaysTasks.length + todaysHabits.length;
  const completedFocusItems =
    todaysTasks.filter((task) => isTaskCompleted(task)).length +
    todaysHabits.filter((habit) => hasLog(habit.id)).length;
  const focusProgress =
    totalFocusItems === 0
      ? 0
      : Math.round((completedFocusItems / totalFocusItems) * 100);

  const allTasksDone =
    todaysTasks.length > 0 &&
    todaysTasks.every((task) => isTaskCompleted(task));
  const allHabitsDone =
    todaysHabits.length > 0 &&
    todaysHabits.every((habit) => hasLog(habit.id));
  const shouldCelebrate = allTasksDone && allHabitsDone;
  const [celebrationDay, setCelebrationDay] = useState<string | null>(null);
  const showCelebrationModal = shouldCelebrate && celebrationDay !== today;

  const dismissCelebration = () => {
    setCelebrationDay(today);
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
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">
              Today’s Focus &amp; Progress
            </p>
            <p className="text-xs text-slate-500">{focusProgress}% complete</p>
          </div>
          {focus && !editingFocus ? (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">{focus}</p>
              <button
                className="cursor-pointer rounded-full px-3 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
                className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                onClick={saveFocus}
              >
                Save today’s focus
              </button>
            </div>
          )}
          <div className="mt-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-500">
              Daily Progress Bar
            </p>
            <br />
          </div>
            <div className="h-8 rounded-full bg-slate-100">
              <div
                className="h-8 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${focusProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {totalFocusItems > 0
                ? `${completedFocusItems} of ${totalFocusItems} items done`
                : "Add a task or habit to start tracking progress."}
            </p>
          </div>
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
          {orderedTodaysTasks.map((task) => {
            const index = Math.max(
              0,
              todaysTasks.findIndex((t) => t.id === task.id)
            );
            const isDone = isTaskCompleted(task);
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
                        <div className="flex gap-2 text-xs">
                          <button
                            className="cursor-pointer rounded-full bg-slate-900 px-3 py-1 font-semibold text-white transition-colors hover:bg-slate-800"
                            onClick={saveEdit}
                          >
                            Save
                          </button>
                          <button
                            className="cursor-pointer rounded-full px-3 py-1 text-slate-500 transition-colors hover:bg-slate-100"
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
                  <div className="hidden items-center gap-2 md:flex">
                    {editingTaskId !== task.id && (
                      <button
                        className="cursor-pointer rounded-full px-3 py-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => startEdit(task)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className={`cursor-pointer rounded-full px-3 py-1 ${
                        isDone
                          ? "text-emerald-700 hover:bg-emerald-100"
                          : "transition-colors hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      onClick={() => moveToTomorrow(task)}
                    >
                      Move to tomorrow ↗
                    </button>
                    <button
                      className="cursor-pointer rounded-full px-3 py-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="relative md:hidden">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-slate-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenTaskMenuId((prev) => (prev === task.id ? null : task.id));
                      }}
                      aria-label="Open task actions"
                    >
                      ⋯
                    </button>
                    {openTaskMenuId === task.id ? (
                      <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                        {editingTaskId !== task.id && (
                          <button
                            className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEdit(task);
                              setOpenTaskMenuId(null);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            moveToTomorrow(task);
                            setOpenTaskMenuId(null);
                          }}
                        >
                          Move to tomorrow
                        </button>
                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-red-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteTask(task.id);
                            setOpenTaskMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
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
            className="cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
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
            const isEditingHabit = editingHabitId === habit.id;
            return (
              <div
                key={habit.id}
                className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-1 transition-colors ${
                  completed
                    ? "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
                onClick={(event) => handleHabitCardClick(event, habit.id)}
              >
                <div className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={completed}
                    onChange={() => toggleHabit(habit.id)}
                  />
                  <div className="w-full text-left">
                    {isEditingHabit ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          value={editingHabitName}
                          onChange={(e) => setEditingHabitName(e.target.value)}
                        />
                        <div className="flex gap-2 text-xs">
                          <button
                            className="cursor-pointer rounded-full bg-slate-900 px-3 py-1 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                            onClick={saveHabitEdit}
                            disabled={!editingHabitName.trim()}
                          >
                            Save
                          </button>
                          <button
                            className="cursor-pointer rounded-full px-3 py-1 text-slate-500 transition-colors hover:bg-slate-100"
                            onClick={cancelHabitEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`font-medium ${
                            completed ? "text-emerald-800" : "text-slate-900"
                          }`}
                        >
                          {habit.name}
                        </p>
                        <p className="text-xs text-slate-500">{habit.description}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative">
                  {!isEditingHabit && (
                    <details className="group">
                      <summary className="flex cursor-pointer items-center rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
                        <span className="text-xl">⋯</span>
                      </summary>
                      <div className="absolute right-0 top-10 z-10 w-32 rounded-2xl border border-slate-100 bg-white p-2 text-sm shadow-lg">
                        <button
                          className="w-full cursor-pointer rounded-lg px-2 py-1 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            startHabitEdit(habit);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full cursor-pointer rounded-lg px-2 py-1 text-left text-red-500 transition hover:bg-red-50"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeDailyHabit(habit.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </details>
                  )}
                </div>
              </div>
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
                    setEditingHabitId(null);
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
                <button
                  className="w-full cursor-pointer rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
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
              className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setShowHabitForm(true)}
            >
              + Add a daily habit
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
