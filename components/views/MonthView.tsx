"use client";

import { useMemo, useState } from "react";
import { AppState, Task } from "@/lib/types";
import {
  formatDisplayDate,
  generateId,
  monthKey,
  tasksForMonth,
} from "@/lib/utils";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const MonthView = ({ state, updateState }: ViewProps) => {
  const key = monthKey(new Date());
  const monthlyReflection = state.reflections.find(
    (ref) => ref.type === "monthly" && ref.content?.month === key
  );
  const [focus, setFocus] = useState(
    monthlyReflection?.content?.focus ?? ""
  );
  const [newMilestone, setNewMilestone] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEdit, setTaskEdit] = useState({
    title: "",
    scheduledFor: "",
    dueDate: "",
  });

  const milestones: string[] = monthlyReflection?.content?.milestones ?? [];

  const monthTasks = useMemo(() => tasksForMonth(state.tasks, key), [
    state.tasks,
    key,
  ]);
  const completedCount = monthTasks.filter((task) => task.status === "done").length;

  const goalsThisMonth = state.goals.filter((goal) =>
    goal.targetDate?.startsWith(key)
  );

  const saveFocus = () => {
    const now = new Date().toISOString();
    updateState((prev) => {
      const base = {
        id: monthlyReflection?.id ?? generateId(),
        type: "monthly" as const,
        content: {
          focus,
          milestones,
          month: key,
        },
        createdAt: monthlyReflection?.createdAt ?? now,
      };
      const filtered = monthlyReflection
        ? prev.reflections.filter((ref) => ref.id !== monthlyReflection.id)
        : prev.reflections;
      return {
        ...prev,
        reflections: [...filtered, base],
      };
    });
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const updated = [...milestones, newMilestone.trim()];
    setNewMilestone("");
    const now = new Date().toISOString();
    updateState((prev) => {
      const base = {
        id: monthlyReflection?.id ?? generateId(),
        type: "monthly" as const,
        content: {
          focus,
          milestones: updated,
          month: key,
        },
        createdAt: monthlyReflection?.createdAt ?? now,
      };
      const filtered = monthlyReflection
        ? prev.reflections.filter((ref) => ref.id !== monthlyReflection.id)
        : prev.reflections;
      return {
        ...prev,
        reflections: [...filtered, base],
      };
    });
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
      scheduledFor: task.scheduledFor ?? "",
      dueDate: task.dueDate ?? "",
    });
  };

  const saveTaskEdit = () => {
    if (!editingTaskId) return;
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: taskEdit.title,
              scheduledFor: taskEdit.scheduledFor || undefined,
              dueDate: taskEdit.dueDate || undefined,
            }
          : task
      ),
    }));
    setEditingTaskId(null);
  };

  const cancelTaskEdit = () => setEditingTaskId(null);

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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Key projects / milestones
          </p>
          <div className="mt-4 space-y-3">
            {goalsThisMonth.map((goal) => (
              <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{goal.title}</p>
                <p className="text-xs text-slate-500">
                  Due {formatDisplayDate(goal.targetDate)}
                </p>
              </div>
            ))}
            {milestones.map((milestone, idx) => (
              <div key={`${milestone}-${idx}`} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-medium text-slate-700">{milestone}</p>
              </div>
            ))}
            {goalsThisMonth.length === 0 && milestones.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No projects logged yet.
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Add monthly milestone"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMilestone()}
            />
            <button
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              onClick={addMilestone}
            >
              Add
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            This month’s tasks overview
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Scheduled
              </p>
              <p className="text-3xl font-semibold text-slate-900">
                {monthTasks.length}
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
          <div className="mt-4 space-y-2">
            {monthTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-sm"
              >
                <div className="flex-1">
                  {editingTaskId === task.id ? (
                    <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={taskEdit.title}
                        onChange={(e) =>
                          setTaskEdit((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <input
                          type="date"
                          className="rounded-xl border border-slate-200 px-2 py-1"
                          value={taskEdit.scheduledFor}
                          onChange={(e) =>
                            setTaskEdit((prev) => ({ ...prev, scheduledFor: e.target.value }))
                          }
                        />
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
                          onClick={saveTaskEdit}
                        >
                          Save
                        </button>
                        <button
                          className="rounded-full px-3 py-1 text-slate-500"
                          onClick={cancelTaskEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="text-left font-medium text-slate-900"
                      onClick={() => startEdit(task)}
                    >
                      {task.title}
                    </button>
                  )}
                  {editingTaskId !== task.id && (
                    <p className="text-xs text-slate-500">
                      {task.scheduledFor
                        ? `Scheduled ${formatDisplayDate(task.scheduledFor)}`
                        : `Due ${formatDisplayDate(task.dueDate)}`}
                    </p>
                  )}
                </div>
                <button
                  className="rounded-full px-3 py-1 text-xs text-red-500 hover:text-red-600"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            ))}
            {monthTasks.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No tasks mapped to this month yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
