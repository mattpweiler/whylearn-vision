"use client";

import { useMemo, useState } from "react";
import { AppState, Goal, PriorityLevel } from "@/lib/types";
import {
  formatDisplayDate,
  generateId,
  isTaskCompleted,
} from "@/lib/utils";
import { GoalColorPicker } from "@/components/goals/GoalColorPicker";
import { DEFAULT_GOAL_COLOR, GoalColor } from "@/lib/goalColors";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const defaultGoal = () => ({
  title: "",
  description: "",
  priority: "medium" as PriorityLevel,
  targetDate: "",
  color: DEFAULT_GOAL_COLOR as GoalColor,
  metricTarget: "",
  metricOptOut: false,
  metricManualTracking: false,
  metricManualProgress: "",
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
    color: DEFAULT_GOAL_COLOR as GoalColor,
    metricTarget: "",
    metricOptOut: false,
    metricManualTracking: false,
    metricManualProgress: "",
  });
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [showGoalTips, setShowGoalTips] = useState(false);

  const priorityBadgeStyles: Record<PriorityLevel, string> = {
    high: "bg-rose-100 text-rose-700 border-rose-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const parseMetricInput = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const parseManualProgressInput = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const activeGoals = state.goals.filter((goal) => goal.status === "active");
  const completedGoals = state.goals
    .filter((goal) => goal.status === "completed")
    .sort(
      (a: any, b: any) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime()
    );
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
    const metricOptOut = form.metricOptOut;
    const metricTarget = metricOptOut
      ? null
      : parseMetricInput(form.metricTarget) ?? null;
    const metricManualTracking = !metricOptOut && form.metricManualTracking;
    const metricManualProgress = metricManualTracking
      ? parseManualProgressInput(form.metricManualProgress) ?? 0
      : null;
    const goal: any = {
      id: generateId(),
      title: form.title.trim(),
      description: form.description?.trim(),
      priority: form.priority,
      targetDate: form.targetDate || endOfYear,
      status: "active",
      createdAt: now,
      color: form.color ?? DEFAULT_GOAL_COLOR,
      metricTarget,
      metricOptOut,
      metricManualTracking,
      metricManualProgress,
    };
    updateState((prev) => ({ ...prev, goals: [goal, ...prev.goals] }));
    setForm(defaultGoal());
    setShowNewGoalForm(false);
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
      color: goal.color ?? DEFAULT_GOAL_COLOR,
      metricTarget:
        goal.metricOptOut || goal.metricTarget === undefined || goal.metricTarget === null
          ? ""
          : String(goal.metricTarget),
      metricOptOut: goal.metricOptOut ?? false,
      metricManualTracking: goal.metricManualTracking ?? false,
      metricManualProgress:
        goal.metricManualTracking && goal.metricManualProgress !== undefined && goal.metricManualProgress !== null
          ? String(goal.metricManualProgress)
          : "",
    });
  };

  const saveGoalEdit = () => {
    if (!editingGoalId) return;
    const metricOptOut = goalEdit.metricOptOut;
    const metricTarget = metricOptOut
      ? null
      : parseMetricInput(goalEdit.metricTarget) ?? null;
    const metricManualTracking = !metricOptOut && goalEdit.metricManualTracking;
    const metricManualProgress = metricManualTracking
      ? parseManualProgressInput(goalEdit.metricManualProgress) ?? 0
      : null;
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
              color: goalEdit.color ?? DEFAULT_GOAL_COLOR,
              metricTarget,
              metricOptOut,
              metricManualTracking,
              metricManualProgress,
            }
          : goal
      ),
    }));
    setEditingGoalId(null);
  };

  const cancelGoalEdit = () => setEditingGoalId(null);

  const toggleGoalCompletion = (goalId: string) => {
    updateState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: goal.status === "completed" ? "active" : "completed",
              completedAt:
                goal.status === "completed" ? undefined : new Date().toISOString(),
            }
          : goal
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">Big yearly goals</p>
              <button
                type="button"
                className="flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                onClick={() => setShowGoalTips((prev) => !prev)}
                aria-label="How do I write a good goal?"
              >
                How do I write a good goal?
              </button>
            </div>
            <button
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              onClick={() => setShowNewGoalForm(true)}
          >
            + New goal
          </button>
        </div>
        {showGoalTips && (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Write goals you can count.</p>
            <p className="mt-1">
              Swap vague outcomes for actions you control: instead of “successful YouTube channel,”
              try “upload two videos every week for the next three months.” Make the action and
              cadence obvious so you can track progress.
            </p>
            <p className="mt-2">
              Think across life areas for ideas—make them measurable:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Financial: “Invest $500 monthly” or “Pay off $10k debt by December.”</li>
              <li>Health: “Run 3x weekly and finish a half marathon in October.”</li>
              <li>Social: “Host a monthly meetup” or “Plan one family trip each quarter.”</li>
              <li>Personal: “Read 24 books this year” or “Study Spanish 20 minutes daily.”</li>
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
            const metricTarget =
              goal.metricOptOut ||
              goal.metricTarget === undefined ||
              goal.metricTarget === null
                ? null
                : goal.metricTarget;
            const hasMetricTarget =
              typeof metricTarget === "number" && Number.isFinite(metricTarget) && metricTarget > 0;
            const usesManualTracking = (goal.metricManualTracking ?? false) && !goal.metricOptOut;
            const manualProgressRaw =
              usesManualTracking && typeof goal.metricManualProgress === "number"
                ? goal.metricManualProgress
                : 0;
            const manualProgress =
              Number.isFinite(manualProgressRaw) && manualProgressRaw >= 0
                ? manualProgressRaw
                : 0;
            const progressDone = usesManualTracking ? manualProgress : goalStats.done;
            const progressDenominator = usesManualTracking
              ? hasMetricTarget
                ? metricTarget
                : manualProgress > 0
                ? manualProgress
                : metricTarget ?? 0
              : hasMetricTarget
              ? metricTarget
              : goalStats.total;
            const goalPercent =
              progressDenominator === 0
                ? 0
                : Math.min(100, Math.round((progressDone / progressDenominator) * 100));
            const remaining = hasMetricTarget
              ? Math.max(metricTarget - progressDone, 0)
              : Math.max(goalStats.total - goalStats.done, 0);
            const targetMillis = goal.targetDate
              ? new Date(goal.targetDate).getTime()
              : null;
            const daysUntilTarget =
              targetMillis && !Number.isNaN(targetMillis)
                ? Math.max(
                    0,
                    Math.ceil((targetMillis - Date.now()) / (1000 * 60 * 60 * 24))
                  )
                : null;
            const pacePerWeek =
              hasMetricTarget && daysUntilTarget && daysUntilTarget > 0
                ? Math.max(1, Math.ceil((remaining / daysUntilTarget) * 7))
                : null;
            const missingMetric = !goal.metricOptOut && !usesManualTracking && !hasMetricTarget;
            const metricStatus = goal.metricOptOut
              ? "No metric"
              : usesManualTracking
              ? hasMetricTarget
                ? `Manual: ${progressDone}/${metricTarget}`
                : `Manual: ${progressDone}`
              : hasMetricTarget
              ? `${goalStats.done}/${metricTarget} done`
              : "Please Quantify Goal";
            const metricStatusClass = [
              "text-[10px] uppercase tracking-wide",
              missingMetric ? "text-red-600" : "text-slate-500",
            ].join(" ");
            const metricNote = goal.metricOptOut
              ? "No metric needed"
              : usesManualTracking
              ? hasMetricTarget
                ? "Tracking manually toward your target"
                : "Tracking progress manually"
              : hasMetricTarget
              ? `Metric target: ${metricTarget} tasks`
              : "No metric set yet—using tasks created";
            const progressLabel = goal.metricOptOut
              ? goalStats.total > 0
                ? `${goalStats.done}/${goalStats.total} tasks`
                : "Not tracked"
              : usesManualTracking
              ? hasMetricTarget
                ? `${progressDone}/${metricTarget} manual`
                : `${progressDone} tracked manually`
              : hasMetricTarget
              ? `${goalStats.done}/${metricTarget} tasks`
              : goalStats.total > 0
              ? `${goalStats.done}/${goalStats.total} tasks`
              : "No tasks yet";
            return (
              <details
                key={goal.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm cursor-pointer"
              >
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm font-semibold text-slate-900">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full border border-slate-200"
                      style={{ backgroundColor: goal.color, color: "#0f172a" }}
                      aria-hidden
                    />
                    <span>{goal.title}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                      <span className="text-lg font-bold text-slate-900">{goalPercent}%</span>
                      <span className={metricStatusClass}>
                        {metricStatus}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex min-w-[160px] flex-1 items-center gap-2 md:flex-none">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${goalPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {progressLabel}
                  </span>
                </div>
                <span
                  className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeStyles[goal.priority]}`}
                >
                  {goal.priority.toUpperCase()}
                </span>
              </summary>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {editingGoalId === goal.id ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 p-3">
                    Title
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={goalEdit.title}
                      onChange={(e) =>
                        setGoalEdit((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                    Description
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
                    <div className="space-y-3 text-xs text-slate-500">
                      {(() => {
                        const metricWarning =
                          !goalEdit.metricOptOut &&
                          !goalEdit.metricManualTracking &&
                          !parseMetricInput(goalEdit.metricTarget);
                        const inputClasses = [
                          "w-full rounded-xl px-3 py-2 text-sm",
                          metricWarning
                            ? "border-red-300 text-red-700 placeholder:text-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border border-slate-200",
                        ].join(" ");
                        return (
                          <>
                            <div className="grid items-center gap-3 md:grid-cols-[1fr_auto]">
                              <label className="flex flex-col gap-1 font-semibold text-slate-600">
                                What does “done” look like? (number)
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  className={inputClasses}
                                  value={goalEdit.metricTarget}
                                  onChange={(e) =>
                                    setGoalEdit((prev) => ({
                                      ...prev,
                                      metricTarget: e.target.value,
                                      metricOptOut:
                                        prev.metricOptOut && e.target.value
                                          ? false
                                          : prev.metricOptOut,
                                    }))
                                  }
                                  disabled={goalEdit.metricOptOut}
                                  placeholder="e.g. 12 tasks"
                                />
                                {metricWarning && (
                                  <span className="text-[11px] font-normal text-red-600">
                                    Add a metric, track manually, or select “No metric needed”
                                  </span>
                                )}
                              </label>
                              <div className="flex flex-col gap-2 font-semibold text-slate-600">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                    checked={goalEdit.metricOptOut}
                                    onChange={(e) =>
                                    setGoalEdit((prev) => ({
                                      ...prev,
                                      metricOptOut: e.target.checked,
                                      metricManualTracking: e.target.checked
                                        ? false
                                        : prev.metricManualTracking,
                                      metricTarget: e.target.checked ? "" : prev.metricTarget,
                                      metricManualProgress: e.target.checked
                                        ? ""
                                        : prev.metricManualProgress,
                                    }))
                                  }
                                />
                                  No metric needed
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                    checked={goalEdit.metricManualTracking && !goalEdit.metricOptOut}
                                    disabled={goalEdit.metricOptOut}
                                    onChange={(e) =>
                                      setGoalEdit((prev) => ({
                                        ...prev,
                                        metricManualTracking: e.target.checked,
                                        metricOptOut: e.target.checked ? false : prev.metricOptOut,
                                      }))
                                    }
                                  />
                                  Track manually
                                </label>
                              </div>
                            </div>
                            {goalEdit.metricManualTracking && !goalEdit.metricOptOut && (
                              <label className="flex flex-col gap-1 font-semibold text-slate-600">
                                Manual progress (e.g. pounds lost, videos published)
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                  value={goalEdit.metricManualProgress}
                                  onChange={(e) =>
                                    setGoalEdit((prev) => ({
                                      ...prev,
                                      metricManualProgress: e.target.value,
                                      metricOptOut: false,
                                    }))
                                  }
                                  placeholder="Enter current progress"
                                />
                                <span className="text-[11px] font-normal text-slate-500">
                                  Enter where you are today. We’ll use this instead of counting tasks.
                                </span>
                              </label>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <GoalColorPicker
                      value={goalEdit.color}
                      onChange={(color) =>
                        setGoalEdit((prev) => ({
                          ...prev,
                          color,
                        }))
                      }
                      className="text-xs"
                    />
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
                        Goal progress
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-900">
                          {goalPercent}%
                        </span>
                        <span
                          className={[
                            "text-[11px] font-semibold uppercase tracking-wide",
                            missingMetric ? "text-red-600" : "text-slate-500",
                          ].join(" ")}
                        >
                          {metricStatus}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${goalPercent}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">{progressLabel}</span>
                        <span className="text-[11px] text-slate-500">{metricNote}</span>
                      </div>
                    </div>
                  </>
                )}
                {editingGoalId !== goal.id && (
                  <div className="flex gap-3 text-xs">
                    <button
                      className={[
                        "font-semibold",
                        missingMetric
                          ? "text-red-600 underline decoration-red-400 decoration-2"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                      onClick={() => startEdit(goal)}
                    >
                      Edit goal
                    </button>
                    <button
                      className="font-semibold text-emerald-600 hover:text-emerald-700"
                      onClick={() => toggleGoalCompletion(goal.id)}
                    >
                      Mark {goal.status === "completed" ? "active" : "complete"}
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
      {showNewGoalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">New goal</p>
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                onClick={() => setShowNewGoalForm(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                Title
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
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
              <div className="md:col-span-2 space-y-3">
                {(() => {
                  const metricWarning =
                    !form.metricOptOut &&
                    !form.metricManualTracking &&
                    !parseMetricInput(form.metricTarget);
                  const inputClasses = [
                    "mt-2 w-full rounded-2xl px-4 py-2 text-sm",
                    metricWarning
                      ? "border-red-300 text-red-700 placeholder:text-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-200",
                  ].join(" ");
                  return (
                    <>
                      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto]">
                        <label className="text-sm font-medium text-slate-600">
                          Metric target (number)
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className={inputClasses}
                            value={form.metricTarget}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                metricTarget: e.target.value,
                                metricOptOut:
                                  prev.metricOptOut && e.target.value ? false : prev.metricOptOut,
                              }))
                            }
                            disabled={form.metricOptOut}
                            placeholder="e.g. 10 to finish"
                          />
                          {metricWarning && (
                            <span className="text-[11px] font-normal text-red-600">
                              Add a metric, track manually, or select “No metric needed”
                            </span>
                          )}
                        </label>
                        <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={form.metricOptOut}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  metricOptOut: e.target.checked,
                                  metricManualTracking: e.target.checked
                                    ? false
                                    : prev.metricManualTracking,
                                  metricTarget: e.target.checked ? "" : prev.metricTarget,
                                  metricManualProgress: e.target.checked
                                    ? ""
                                    : prev.metricManualProgress,
                                }))
                              }
                            />
                            No metric needed
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={form.metricManualTracking && !form.metricOptOut}
                              disabled={form.metricOptOut}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  metricManualTracking: e.target.checked,
                                  metricOptOut: e.target.checked ? false : prev.metricOptOut,
                                }))
                              }
                            />
                            Track manually
                          </label>
                        </div>
                      </div>
                      {form.metricManualTracking && !form.metricOptOut && (
                        <label className="text-sm font-medium text-slate-600">
                          Manual progress right now
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                            value={form.metricManualProgress}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                metricManualProgress: e.target.value,
                                metricOptOut: false,
                              }))
                            }
                            placeholder="e.g. 5 (current progress)"
                          />
                          <span className="mt-1 block text-[11px] font-normal text-slate-500">
                            We’ll use this number instead of counting tasks.
                          </span>
                        </label>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="md:col-span-2">
                <GoalColorPicker
                  value={form.color}
                  onChange={(color) => setForm((prev) => ({ ...prev, color }))}
                />
              </div>
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
              className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              onClick={addGoal}
            >
              Create goal
            </button>
          </div>
        </div>
      )}

      {completedGoals.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">Completed goals</p>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {completedGoals.length}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {completedGoals.map((goal: any) => (
              <div
                key={goal.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {goal.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Completed {formatDisplayDate(goal.completedAt ?? goal.createdAt)}
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    onClick={() => toggleGoalCompletion(goal.id)}
                  >
                    Mark active
                  </button>
                </div>
                {goal.description && (
                  <p className="mt-2 text-sm text-slate-600">{goal.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
