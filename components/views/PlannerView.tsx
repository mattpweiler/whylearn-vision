"use client";

import { useEffect, useMemo, useState, type DragEvent, type MouseEvent } from "react";
import { AppState, Task } from "@/lib/types";
import { DEFAULT_GOAL_COLOR } from "@/lib/goalColors";
import {
  endOfWeek,
  formatDateKey,
  formatDateWithWeekday,
  generateId,
  isTaskCompleted,
  isWithinRange,
  monthLabel,
  normalizeDate,
  recurrenceDatesForYear,
  sortTasks,
  startOfWeek,
  taskEffectiveDate,
  tasksByDateWithinRange,
  todayKey,
  weekDateKeys,
} from "@/lib/utils";
import { TrashIcon } from "@/components/financial/TrashIcon";

type PlannerMode = "week" | "month";
type RecurrenceChoice = "none" | "weekly" | "monthly";

const UNSCHEDULED_BUCKET = "__unscheduled";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return new Date();
  }
  return new Date(year, month - 1, day);
};

const labelForDateKey = (value: string) => formatDateWithWeekday(value) || value;
const nowMonthLabel = () => monthLabel(new Date());

export const PlannerView = ({ state, updateState }: ViewProps) => {
  const weekStart = state.settings.weekStartDay ?? 1;
  const today = todayKey();
  const todayDateKey = today;

  const [mode, setMode] = useState<PlannerMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [backlogTitle, setBacklogTitle] = useState("");
  const [backlogGoalId, setBacklogGoalId] = useState("");
  const [backlogCategory, setBacklogCategory] = useState("");
  const [backlogDueDate, setBacklogDueDate] = useState("");
  const [backlogError, setBacklogError] = useState<string | null>(null);
  const [backlogRecurrence, setBacklogRecurrence] =
    useState<RecurrenceChoice>("none");
  const [dayModalRecurrence, setDayModalRecurrence] =
    useState<RecurrenceChoice>("none");
  const [showUnscheduledOnly, setShowUnscheduledOnly] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEditDraft, setTaskEditDraft] = useState<{
    title: string;
    scheduledDate: string;
    priority: Task["priority"];
    goalId: string;
  }>({
    title: "",
    scheduledDate: "",
    priority: "medium",
    goalId: "",
  });
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [deletedPlaceholders, setDeletedPlaceholders] = useState<
    { task: Task; bucketKey: string; orderIndex: number; timeoutId: ReturnType<typeof setTimeout> }[]
  >([]);
  const [pendingRecurringDelete, setPendingRecurringDelete] = useState<Task | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedPastDates, setExpandedPastDates] = useState<Record<string, boolean>>({});
  const [includeNext7Days, setIncludeNext7Days] = useState(false);
  const [hidePastDates, setHidePastDates] = useState(true);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dayModalTaskTitle, setDayModalTaskTitle] = useState("");
  const recurrenceOptions: { value: RecurrenceChoice; label: string }[] = [
    { value: "none", label: "Does not repeat" },
    { value: "weekly", label: "Repeats weekly" },
    { value: "monthly", label: "Repeats monthly" },
  ];

  useEffect(() => {
    if (!openTaskMenuId) return;
    const handler = (event: globalThis.MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(`[data-task-menu-id="${openTaskMenuId}"]`)) return;
      setOpenTaskMenuId(null);
    };
    const handleMouseDown = (event: globalThis.MouseEvent) => handler(event);
    const handleTouchStart = (event: TouchEvent) => handler(event);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleTouchStart);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [openTaskMenuId]);

  useEffect(() => {
    return () => {
      deletedPlaceholders.forEach((item) => clearTimeout(item.timeoutId));
    };
  }, [deletedPlaceholders]);

  const normalizedAnchor = useMemo(
    () => normalizeDate(anchorDate),
    [anchorDate]
  );

  const weekStartDate = startOfWeek(normalizedAnchor, weekStart);
  const weekEndDate = endOfWeek(normalizedAnchor, weekStart);
  const weekDates = weekDateKeys(normalizedAnchor, weekStart);
  const weekRangeStartKey = formatDateKey(weekStartDate);
  const weekRangeEndKey = formatDateKey(weekEndDate);

  const monthStartDate = useMemo(
    () => new Date(normalizedAnchor.getFullYear(), normalizedAnchor.getMonth(), 1),
    [normalizedAnchor]
  );
  const monthEndDate = useMemo(
    () => new Date(normalizedAnchor.getFullYear(), normalizedAnchor.getMonth() + 1, 0),
    [normalizedAnchor]
  );
  const calendarStartDate = startOfWeek(monthStartDate, weekStart);
  const calendarEndDate = endOfWeek(monthEndDate, weekStart);
  const calendarRangeStartKey = formatDateKey(calendarStartDate);
  const calendarRangeEndKey = formatDateKey(calendarEndDate);
  const monthLabelText = monthLabel(monthStartDate);

  const rangeStartKey = mode === "week" ? weekRangeStartKey : calendarRangeStartKey;
  const rangeEndKey = mode === "week" ? weekRangeEndKey : calendarRangeEndKey;
  const currentSelectedDate = useMemo(
    () =>
      isWithinRange(selectedDate, rangeStartKey, rangeEndKey)
        ? selectedDate
        : rangeStartKey,
    [rangeEndKey, rangeStartKey, selectedDate]
  );
  const extendedRangeEndKey = useMemo(() => {
    if (!includeNext7Days) return rangeEndKey;
    const parsed = parseDateKey(rangeEndKey);
    parsed.setDate(parsed.getDate() + 7);
    return formatDateKey(parsed);
  }, [includeNext7Days, rangeEndKey]);

  const tasksByDate = (() => {
    const grouped = tasksByDateWithinRange(state.tasks, rangeStartKey, rangeEndKey);
    const reordered: typeof grouped = {};
    Object.keys(grouped).forEach((key) => {
      reordered[key] = reorderByCompletion(sortTasks(grouped[key]));
    });
    return reordered;
  })();

  const dayModalTasks = dayModalDate ? tasksByDate[dayModalDate] ?? [] : [];

  const goalLookup = useMemo(() => {
    const map: Record<string, string> = {};
    state.goals.forEach((goal) => {
      map[goal.id] = goal.title;
    });
    return map;
  }, [state.goals]);
  const goalColorLookup = useMemo(() => {
    const map: Record<string, string> = {};
    state.goals.forEach((goal) => {
      map[goal.id] = goal.color ?? DEFAULT_GOAL_COLOR;
    });
    return map;
  }, [state.goals]);

  const visibleTasks = useMemo(
    () =>
      state.tasks.filter((task) => {
        const key = taskEffectiveDate(task);
        if (!key) return true;
        return isWithinRange(key, rangeStartKey, extendedRangeEndKey);
      }),
    [extendedRangeEndKey, rangeStartKey, state.tasks]
  );

  function reorderByCompletion(tasks: Task[]) {
    const pending = tasks.filter((task) => !isTaskCompleted(task));
    const done = tasks.filter((task) => isTaskCompleted(task));
    return [...pending, ...done];
  }

  const groupedTasks = (() => {
    const scheduled: Record<string, Task[]> = {};
    const unscheduled: Task[] = [];
    visibleTasks.forEach((task) => {
      const key = taskEffectiveDate(task);
      if (key) {
        if (!scheduled[key]) scheduled[key] = [];
        scheduled[key].push(task);
      } else {
        unscheduled.push(task);
      }
    });
    Object.keys(scheduled).forEach((key) => {
      scheduled[key] = reorderByCompletion(sortTasks(scheduled[key]));
    });
    return {
      scheduled,
      sortedDates: Object.keys(scheduled).sort(),
      unscheduled: reorderByCompletion(sortTasks(unscheduled)),
    };
  })();
  const placeholderBuckets = useMemo(
    () => new Set(deletedPlaceholders.map((item) => item.bucketKey)),
    [deletedPlaceholders]
  );
  const sortedScheduledBuckets = (() => {
    const keys = new Set<string>(Object.keys(groupedTasks.scheduled));
    deletedPlaceholders.forEach((item) => {
      if (item.bucketKey !== UNSCHEDULED_BUCKET) {
        keys.add(item.bucketKey);
      }
    });
    return Array.from(keys).sort();
  })();

  const toggleTaskCompletion = (taskId: string | Task) => {
    const targetId = typeof taskId === "string" ? taskId : taskId.id;
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === targetId
          ? {
              ...task,
              status: isTaskCompleted(task) ? "todo" : "done",
            }
          : task
      ),
    }));
  };

  const deleteTask = (task: Task, scope: "single" | "all" = "single") => {
    const targets =
      scope === "all" && task.recurrenceGroupId
        ? state.tasks.filter((t) => t.recurrenceGroupId === task.recurrenceGroupId)
        : [task];
    const targetIds = new Set(targets.map((item) => item.id));
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => !targetIds.has(t.id)),
    }));
    if (task.recurrenceGroupId) {
      return;
    }
    const placeholders = targets.map((item) => {
      const bucketKey = bucketKeyForTask(item);
      const orderIndex = item.orderIndex ?? 0;
      const timeoutId = setTimeout(() => {
        setDeletedPlaceholders((prev) =>
          prev.filter((placeholder) => placeholder.task.id !== item.id)
        );
      }, 7000);
      return { task: item, bucketKey, orderIndex, timeoutId };
    });
    setDeletedPlaceholders((prev) => [
      ...prev.filter((item) => !targetIds.has(item.task.id)),
      ...placeholders,
    ]);
  };

  const requestDeleteTask = (task: Task) => {
    if (task.recurrenceGroupId) {
      setPendingRecurringDelete(task);
      return;
    }
    deleteTask(task);
  };

  const confirmRecurringDeletion = (scope: "single" | "all") => {
    if (!pendingRecurringDelete) return;
    deleteTask(pendingRecurringDelete, scope);
    setPendingRecurringDelete(null);
  };

  const cancelRecurringDelete = () => setPendingRecurringDelete(null);

  const undoDelete = (taskId: string) => {
    const placeholder = deletedPlaceholders.find((item) => item.task.id === taskId);
    if (!placeholder) return;
    clearTimeout(placeholder.timeoutId);
    setDeletedPlaceholders((prev) => prev.filter((item) => item.task.id !== taskId));
    updateState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, placeholder.task],
    }));
  };

  const bucketKeyForTask = (task: Task) =>
    taskEffectiveDate(task) ?? UNSCHEDULED_BUCKET;

  const reorderTaskRelative = (sourceId: string, targetTask: Task) => {
    updateState((prev) => {
      const source = prev.tasks.find((task) => task.id === sourceId);
      const target = prev.tasks.find((task) => task.id === targetTask.id);
      if (!source || !target) return prev;
      const sourceBucket = bucketKeyForTask(source);
      const targetBucket = bucketKeyForTask(target);

      const targetBucketTasks = prev.tasks
        .filter((task) => bucketKeyForTask(task) === targetBucket && task.id !== sourceId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      const targetIndex = targetBucketTasks.findIndex((task) => task.id === targetTask.id);
      targetBucketTasks.splice(
        targetIndex >= 0 ? targetIndex : targetBucketTasks.length,
        0,
        source
      );
      const targetOrder = targetBucketTasks.map((task, index) => ({
        id: task.id,
        orderIndex: index + 1,
      }));

      const sourceOrder =
        sourceBucket !== targetBucket
          ? prev.tasks
              .filter(
                (task) => bucketKeyForTask(task) === sourceBucket && task.id !== sourceId
              )
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((task, index) => ({ id: task.id, orderIndex: index + 1 }))
          : [];

      const targetDateValue =
        targetBucket === UNSCHEDULED_BUCKET ? null : targetBucket;

      return {
        ...prev,
        tasks: prev.tasks.map((task) => {
          if (task.id === sourceId) {
            const targetOrderRecord = targetOrder.find((item) => item.id === task.id);
            return {
              ...task,
              scheduledDate: targetDateValue,
              scheduledFor: targetDateValue ?? undefined,
              month:
                targetDateValue && targetDateValue !== UNSCHEDULED_BUCKET
                  ? monthLabel(parseDateKey(targetDateValue))
                  : task.month,
              orderIndex: targetOrderRecord?.orderIndex ?? task.orderIndex,
            };
          }
          if (targetOrder.some((item) => item.id === task.id)) {
            const record = targetOrder.find((item) => item.id === task.id);
            return { ...task, orderIndex: record?.orderIndex ?? task.orderIndex };
          }
          if (sourceOrder.some((item) => item.id === task.id)) {
            const record = sourceOrder.find((item) => item.id === task.id);
            return { ...task, orderIndex: record?.orderIndex ?? task.orderIndex };
          }
          return task;
        }),
      };
    });
  };

  const moveTaskToDate = (taskId: string, dateKey: string) => {
    if (!dateKey) return;
    const monthTag = monthLabel(parseDateKey(dateKey));
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              scheduledFor: dateKey,
              scheduledDate: dateKey,
              month: monthTag,
            }
          : task
      ),
    }));
  };

  const moveTaskToBacklog = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              scheduledFor: undefined,
              scheduledDate: null,
              dueDate: undefined,
            }
          : task
      ),
    }));
  };

  const addBacklogTask = () => {
    if (!backlogTitle.trim()) return;
    if (backlogRecurrence !== "none" && !backlogDueDate) {
      setBacklogError("Must provide start date for recurring tasks");
      return;
    }
    const stamp = new Date().toISOString();
    const cadence =
      backlogRecurrence === "none" ? undefined : backlogRecurrence;
    const startDate = backlogDueDate || todayDateKey;
    const dates =
      cadence && backlogDueDate
        ? recurrenceDatesForYear(startDate, cadence)
        : [startDate];
    const recurrenceGroupId = cadence ? generateId() : undefined;
    updateState((prev) => {
      const orderStart = prev.tasks.length;
      const newTasks: Task[] = dates.map((dateKey, index) => {
        const monthTag = cadence
          ? monthLabel(parseDateKey(dateKey))
          : backlogDueDate
            ? monthLabel(parseDateKey(backlogDueDate))
            : nowMonthLabel();
        const dueDateValue = cadence
          ? dateKey
          : backlogDueDate || undefined;
        return {
          id: generateId(),
          title: backlogTitle.trim(),
          status: "todo",
          priority: "medium",
          goalId: backlogGoalId || undefined,
          backlogCategory: backlogCategory || undefined,
          dueDate: dueDateValue,
          scheduledFor: cadence ? dateKey : undefined,
          scheduledDate: cadence ? dateKey : null,
          month: monthTag,
          recurrenceGroupId,
          recurrenceCadence: cadence,
          recurrenceStartDate: cadence ? startDate : undefined,
          orderIndex: orderStart + index + 1,
          createdAt: stamp,
        };
      });
      return {
        ...prev,
        tasks: [...prev.tasks, ...newTasks],
      };
    });
    setBacklogError(null);
    setBacklogTitle("");
    setBacklogGoalId("");
    setBacklogCategory("");
    setBacklogDueDate("");
    setBacklogRecurrence("none");
  };

  const handleSubmitNewTask = () => {
    addBacklogTask();
    setIsCreateModalOpen(false);
  };

  const handleSelectDate = (dateKey: string, recenter = false) => {
    setSelectedDate(dateKey);
    if (mode === "week" || recenter) {
      setAnchorDate(parseDateKey(dateKey));
    }
  };

  const openDayModal = (dateKey: string, recenter = false) => {
    handleSelectDate(dateKey, recenter);
    setDayModalDate(dateKey);
    setDayModalTaskTitle("");
    setDayModalRecurrence("none");
  };

  const closeDayModal = () => {
    setDayModalDate(null);
    setDayModalTaskTitle("");
    setDayModalRecurrence("none");
  };

  const addTaskForModalDate = () => {
    if (!dayModalDate) return;
    const title = dayModalTaskTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    const cadence =
      dayModalRecurrence === "none" ? undefined : dayModalRecurrence;
    const dates = cadence
      ? recurrenceDatesForYear(dayModalDate, cadence)
      : [dayModalDate];
    const recurrenceGroupId = cadence ? generateId() : undefined;
    updateState((prev) => {
      const orderStart = prev.tasks.length;
      return {
        ...prev,
        tasks: [
          ...prev.tasks,
          ...dates.map((dateKey, index) => ({
            id: generateId(),
            title,
            status: "todo",
            priority: "medium",
            orderIndex: orderStart + index + 1,
            scheduledFor: dateKey,
            scheduledDate: dateKey,
            month: monthLabel(parseDateKey(dateKey)),
          recurrenceGroupId,
          recurrenceCadence: cadence,
          recurrenceStartDate: cadence ? dayModalDate : undefined,
          createdAt: now,
          })),
        ],
      } as any;
    });
    setDayModalTaskTitle("");
    setDayModalRecurrence("none");
  };

  const handleTaskDrop = (dateKey: string) => {
    if (!draggingTaskId) return;
    moveTaskToDate(draggingTaskId, dateKey);
    setDraggingTaskId(null);
  };

  const handleUnscheduledDrop = () => {
    if (!draggingTaskId) return;
    moveTaskToBacklog(draggingTaskId);
    setDraggingTaskId(null);
  };

  const handleDragStart = (taskId: string, event: DragEvent) => {
    setDraggingTaskId(taskId);
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", taskId);
      event.dataTransfer.effectAllowed = "move";
    }
  };

  const togglePastDateSection = (dateKey: string) => {
    setExpandedPastDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const handleTaskRowDrop = (targetTask: Task) => {
    if (!draggingTaskId || draggingTaskId === targetTask.id) return;
    reorderTaskRelative(draggingTaskId, targetTask);
    setDraggingTaskId(null);
  };

  const handleTaskRowClick = (event: MouseEvent<HTMLDivElement>, task: Task) => {
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
    toggleTaskCompletion(task);
  };

  const goToToday = () => {
    const now = new Date();
    setAnchorDate(now);
    setSelectedDate(today);
  };

  const goBackward = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (mode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const goForward = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (mode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const switchMode = (nextMode: PlannerMode) => {
    setMode(nextMode);
    setAnchorDate(parseDateKey(currentSelectedDate));
  };

  const combineTasksWithPlaceholders = (tasks: Task[], bucketKey: string) => {
    const placeholders = deletedPlaceholders.filter(
      (item) => item.bucketKey === bucketKey
    );
    const combined = [
      ...tasks.map((task) => ({
        kind: "task" as const,
        orderIndex: task.orderIndex ?? 0,
        task,
      })),
      ...placeholders.map((placeholder) => ({
        kind: "placeholder" as const,
        orderIndex: placeholder.orderIndex,
        placeholder,
      })),
    ];
    return combined.sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const renderDeletedPlaceholder = (item: { task: Task }) => (
    <div
      key={`deleted-${item.task.id}`}
      className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm"
      role="button"
      tabIndex={0}
      onClick={() => undoDelete(item.task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          undoDelete(item.task.id);
        }
      }}
    >
      <p className="font-semibold text-slate-900">Task deleted</p>
      <p className="text-slate-600">
        Click to undo and restore &ldquo;{item.task.title}&rdquo;.
      </p>
    </div>
  );

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), weekStart);
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d.toLocaleDateString(undefined, { weekday: "short" });
    });
  }, [weekStart]);

  const monthCalendarRows = useMemo(() => {
    const rows: { key: string; inMonth: boolean }[][] = [];
    const days: { key: string; inMonth: boolean }[] = [];
    const cursor = new Date(calendarStartDate);
    while (cursor <= calendarEndDate) {
      days.push({
        key: formatDateKey(cursor),
        inMonth: cursor.getMonth() === monthStartDate.getMonth(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [calendarEndDate, calendarStartDate, monthStartDate]);

  const startTaskEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskEditDraft({
      title: task.title,
      scheduledDate: task.scheduledDate ?? task.scheduledFor ?? "",
      priority: task.priority,
      goalId: task.goalId ?? "",
    });
  };

  const cancelTaskEdit = () => setEditingTaskId(null);

  const saveTaskEdit = () => {
    if (!editingTaskId) return;
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: taskEditDraft.title,
              priority: taskEditDraft.priority,
              scheduledDate: taskEditDraft.scheduledDate || null,
              scheduledFor: taskEditDraft.scheduledDate || undefined,
              goalId: taskEditDraft.goalId || undefined,
            }
          : task
      ),
    }));
    setEditingTaskId(null);
  };

  const renderTaskRow = (task: Task) => {
    const scheduledDate = task.scheduledDate ?? task.scheduledFor ?? "";
    const isDone = isTaskCompleted(task);
    const isEditing = editingTaskId === task.id;
    return (
      <div
        key={task.id}
        className={`relative flex cursor-pointer flex-wrap items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
          isDone
            ? "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50"
            : "border-slate-100 bg-white/60 hover:border-slate-200 hover:bg-white"
        }`}
        draggable
        onDragStart={(event) => handleDragStart(task.id, event)}
        onDragEnd={() => setDraggingTaskId(null)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleTaskRowDrop(task);
        }}
        onClick={(event) => handleTaskRowClick(event, task)}
      >
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-2 lg:flex-1">
            <input
              type="checkbox"
              checked={isDone}
              onChange={() => toggleTaskCompletion(task)}
            />
            <div className="flex-1">
              {isEditing ? (
                <>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={taskEditDraft.title}
                    onChange={(e) =>
                      setTaskEditDraft((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={taskEditDraft.priority}
                    onChange={(e) =>
                      setTaskEditDraft((prev) => ({
                        ...prev,
                        priority: e.target.value as Task["priority"],
                      }))
                    }
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={taskEditDraft.goalId}
                    onChange={(e) =>
                      setTaskEditDraft((prev) => ({
                        ...prev,
                        goalId: e.target.value,
                      }))
                    }
                  >
                    <option value="">No goal</option>
                    {state.goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <p
                    className={`font-medium ${
                      isDone
                        ? "text-emerald-800 line-through decoration-emerald-600"
                        : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.goalId && (
                    <p className="text-xs text-slate-500">
                      Linked goal: {goalLookup[task.goalId]}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {isEditing ? (
              <>
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-1 text-sm sm:w-40"
                  value={taskEditDraft.scheduledDate}
                  onChange={(e) =>
                    setTaskEditDraft((prev) => ({
                      ...prev,
                      scheduledDate: e.target.value,
                    }))
                  }
                />
                <button
                  className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white disabled:opacity-50"
                  onClick={saveTaskEdit}
                  disabled={!taskEditDraft.title.trim()}
                >
                  Save
                </button>
                <button
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600"
                  onClick={cancelTaskEdit}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="hidden items-center gap-2 sm:flex sm:flex-wrap">
                  <input
                    type="date"
                    className="rounded-xl border border-slate-200 px-3 py-1 text-sm sm:w-40"
                    value={scheduledDate}
                    onChange={(e) => moveTaskToDate(task.id, e.target.value)}
                  />
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600"
                    onClick={() => moveTaskToBacklog(task.id)}
                    disabled={!scheduledDate}
                  >
                    Unschedule
                  </button>
                  <button
                    className="rounded-full border border-slate-200 p-2 text-slate-600"
                    onClick={() => startTaskEdit(task)}
                    aria-label="Edit task"
                  >
                    ✏️
                  </button>
                  <button
                    className="rounded-full p-2 text-red-500"
                    onClick={() => requestDeleteTask(task)}
                    aria-label="Delete task"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {!isEditing && (
          <div className="absolute right-3 top-3 sm:hidden" data-task-menu-id={task.id}>
            <div className="relative">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-slate-100"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenTaskMenuId((prev) => (prev === task.id ? null : task.id));
                }}
                aria-label="Open task actions"
                data-task-menu-id={task.id}
              >
                ⋯
              </button>
              {openTaskMenuId === task.id ? (
                <div
                  className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg"
                  data-task-menu-id={task.id}
                >
                  <label className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-slate-700" data-task-menu-id={task.id}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Set date
                    </span>
                    <input
                      type="date"
                      className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-900"
                      value={scheduledDate}
                      onChange={(event) => {
                        event.stopPropagation();
                        moveTaskToDate(task.id, event.target.value);
                        setOpenTaskMenuId(null);
                      }}
                      data-task-menu-id={task.id}
                    />
                  </label>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveTaskToBacklog(task.id);
                      setOpenTaskMenuId(null);
                    }}
                    disabled={!scheduledDate}
                    data-task-menu-id={task.id}
                  >
                    Unschedule
                  </button>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      startTaskEdit(task);
                      setOpenTaskMenuId(null);
                    }}
                    data-task-menu-id={task.id}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-red-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestDeleteTask(task);
                      setOpenTaskMenuId(null);
                    }}
                    data-task-menu-id={task.id}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  };

  const isRecurringWithoutStartDate =
    backlogRecurrence !== "none" && !backlogDueDate;
  const isSaveDisabled = !backlogTitle.trim() || isRecurringWithoutStartDate;
  const recurringStartDateError = isRecurringWithoutStartDate
    ? "Must provide start date for recurring tasks"
    : null;

  return (
    <>
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-1">
              <button
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer hover:-translate-y-0.5 ${
                  mode === "week"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500"
                }`}
                onClick={() => switchMode("week")}
              >
                Week view
              </button>
              <button
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer hover:-translate-y-0.5 ${
                  mode === "month"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500"
                }`}
                onClick={() => switchMode("month")}
              >
                Month view
              </button>
            </div>
            <div className="flex rounded-2xl border border-slate-200">
              <button
                className="rounded-l-2xl px-3 py-2 text-sm text-slate-600 transition cursor-pointer hover:-translate-y-0.5 hover:bg-slate-100"
                onClick={goBackward}
              >
                ←
              </button>
              <button
                className="px-3 py-2 text-sm text-slate-600 transition cursor-pointer hover:-translate-y-0.5 hover:bg-slate-100"
                onClick={goToToday}
              >
                Today
              </button>
              <button
                className="rounded-r-2xl px-3 py-2 text-sm text-slate-600 transition cursor-pointer hover:-translate-y-0.5 hover:bg-slate-100"
                onClick={goForward}
              >
                →
              </button>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-600">
            Focused on{" "}
            {mode === "week"
              ? `${labelForDateKey(weekRangeStartKey)} - ${labelForDateKey(
                  weekRangeEndKey
                )}`
              : monthLabelText}
          </div>
        </div>

        <div className="mt-6 max-h-[60vh] overflow-y-auto md:max-h-none">
          <div className="mb-2 hidden grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          {mode === "week" ? (
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
              {weekDates.map((dateKey) => {
                const dayTasks = tasksByDate[dateKey] ?? [];
                const isSelected = currentSelectedDate === dateKey;
                const isToday = today === dateKey;
                const displayLabel = parseDateKey(dateKey).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const dayNumber = dateKey.split("-")[2];
                return (
                  <button
                    key={dateKey}
                    className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border p-3 text-left transition cursor-pointer ${
                      isSelected
                        ? "border-slate-900 bg-slate-900/5"
                        : "border-slate-100 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                    }`}
                    onClick={() => openDayModal(dateKey)}
                    onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleTaskDrop(dateKey);
                      }}
                    type="button"
                    aria-label={`Day ${displayLabel}`}
                  >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>
                          <span className="md:hidden">{displayLabel}</span>
                          <span className="hidden md:inline">{dayNumber}</span>
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white">
                            Today
                          </span>
                        )}
                    </div>
                    <div className="mt-2 max-h-28 min-w-0 space-y-1 overflow-y-auto overflow-x-hidden text-xs text-slate-600">
                      {dayTasks.length === 0 ? (
                        <p className="text-[10px] text-slate-400">No tasks</p>
                      ) : (
                        dayTasks.map((task) => {
                          const goalColor = task.goalId
                            ? goalColorLookup[task.goalId] ?? DEFAULT_GOAL_COLOR
                            : DEFAULT_GOAL_COLOR;
                          const isDone = isTaskCompleted(task);
                          return (
                            <p key={task.id} className="w-full">
                              <span
                                className={`inline-flex w-full items-center gap-2 truncate rounded-xl border px-2 py-1 ${
                                  isDone ? "line-through" : ""
                                }`}
                                style={{
                                  backgroundColor: goalColor,
                                  color: "#0f172a",
                                  borderColor: "#cbd5e1",
                                }}
                              >
                                <span className="truncate">{task.title}</span>
                              </span>
                            </p>
                          );
                        })
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {monthCalendarRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-7 gap-2">
                  {row.map((day) => {
                    const dayTasks = tasksByDate[day.key] ?? [];
                    const isSelected = currentSelectedDate === day.key;
                    const isToday = today === day.key;
                    const displayLabel = parseDateKey(day.key).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const dayNumber = day.key.split("-")[2];
                    return (
                      <button
                        key={day.key}
                        className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border p-3 text-left text-sm transition cursor-pointer ${
                          isSelected
                            ? "border-slate-900 bg-slate-900/5"
                            : "border-slate-100 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                        } ${day.inMonth ? "" : "opacity-60"}`}
                        onClick={() => openDayModal(day.key, !day.inMonth)}
                        onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleTaskDrop(day.key);
                          }}
                        type="button"
                        aria-label={`Day ${displayLabel}`}
                        role="button"
                        tabIndex={0}
                      >
                          <div className="flex items-center justify-between font-semibold">
                            <span>
                              <span className="md:hidden">{displayLabel}</span>
                              <span className="hidden md:inline">{dayNumber}</span>
                            </span>
                            {isToday && (
                              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white">
                                Today
                              </span>
                            )}
                        </div>
                        <div className="mt-2 max-h-24 min-w-0 space-y-1 overflow-y-auto overflow-x-hidden text-[11px] text-slate-600">
                          {dayTasks.length === 0 ? (
                            <p className="text-[10px] text-slate-400">No tasks</p>
                          ) : (
                            dayTasks.map((task) => {
                              const goalColor = task.goalId
                                ? goalColorLookup[task.goalId] ?? DEFAULT_GOAL_COLOR
                                : DEFAULT_GOAL_COLOR;
                              const isDone = isTaskCompleted(task);
                              return (
                                <p key={task.id} className="w-full">
                                  <span
                                    className={`inline-flex w-full items-center gap-2 truncate rounded-xl border px-2 py-1 ${
                                      isDone ? "line-through" : ""
                                    }`}
                                    style={{
                                      backgroundColor: goalColor,
                                      color: "#0f172a",
                                      borderColor: "#cbd5e1",
                                    }}
                                  >
                                    <span className="truncate">{task.title}</span>
                                  </span>
                                </p>
                              );
                            })
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
        <button
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:cursor-pointer"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Add task
        </button>
      </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">All tasks</p>
            <p className="text-sm text-slate-500">
              Showing tasks scheduled between {labelForDateKey(rangeStartKey)} and{" "}
              {labelForDateKey(extendedRangeEndKey)}.
            </p>
          </div>
          <button
            className="mt-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 sm:mt-0 hover:border-slate-300 hover:bg-slate-50 hover:cursor-pointer"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Add task
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total tasks
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {visibleTasks.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Unscheduled
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {groupedTasks.unscheduled.length}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={hidePastDates}
              onChange={(e) => setHidePastDates(e.target.checked)}
            />
            Hide past dates
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={showUnscheduledOnly}
              onChange={(e) => setShowUnscheduledOnly(e.target.checked)}
            />
            Show only unscheduled tasks
          </label>
          <button
            className="ml-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:cursor-pointer"
            onClick={() => setIncludeNext7Days((prev) => !prev)}
          >
            {includeNext7Days ? "Hide next 7 days" : "View next 7 days"}
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {!showUnscheduledOnly &&
            sortedScheduledBuckets
              .filter((dateKey) => (hidePastDates ? dateKey >= todayDateKey : true))
              .map((dateKey) => {
              const dayTasks = groupedTasks.scheduled[dateKey] ?? [];
              const hasPlaceholder = placeholderBuckets.has(dateKey);
              if (dayTasks.length === 0 && !hasPlaceholder) return null;
              const isPast = dateKey < todayDateKey;
              const isExpanded = !isPast || expandedPastDates[dateKey];
              return (
                <div
                  key={dateKey}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleTaskDrop(dateKey);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <button
                      className="text-left text-sm font-semibold text-slate-900"
                      onClick={() => isPast && togglePastDateSection(dateKey)}
                      disabled={!isPast}
                    >
                      {formatDateWithWeekday(dateKey)}
                      {isPast && (
                        <span className="ml-2 text-xs text-slate-500">
                          {isExpanded ? "Hide" : "Show"}
                        </span>
                      )}
                    </button>
                    <span className="text-xs text-slate-500">
                      {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {combineTasksWithPlaceholders(dayTasks, dateKey).map((item) =>
                        item.kind === "task"
                          ? renderTaskRow(item.task)
                          : renderDeletedPlaceholder(item.placeholder)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          {(groupedTasks.unscheduled.length > 0 ||
            placeholderBuckets.has(UNSCHEDULED_BUCKET) ||
            showUnscheduledOnly) && (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleUnscheduledDrop();
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Unscheduled tasks
                </p>
                <span className="text-xs text-slate-500">
                  {groupedTasks.unscheduled.length}{" "}
                  {groupedTasks.unscheduled.length === 1 ? "task" : "tasks"}
                </span>
              </div>
              {groupedTasks.unscheduled.length === 0 &&
              !placeholderBuckets.has(UNSCHEDULED_BUCKET) ? (
                <p className="mt-3 text-sm text-slate-500">
                  No unscheduled tasks right now.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {combineTasksWithPlaceholders(
                    groupedTasks.unscheduled,
                    UNSCHEDULED_BUCKET
                  ).map((item) =>
                    item.kind === "task"
                      ? renderTaskRow(item.task)
                      : renderDeletedPlaceholder(item.placeholder)
                  )}
                </div>
              )}
            </div>
          )}
          {state.tasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No tasks captured yet. Start by logging one above.
            </p>
          )}
        </div>
      </section>
    </div>
    {dayModalDate && (
      <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-slate-900/40"
          onClick={closeDayModal}
        />
        <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Tasks for
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {labelForDateKey(dayModalDate)}
              </p>
            </div>
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              onClick={closeDayModal}
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Add a task for this day…"
              value={dayModalTaskTitle}
              onChange={(e) => setDayModalTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTaskForModalDate()}
            />
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={dayModalRecurrence}
              onChange={(e) =>
                setDayModalRecurrence(e.target.value as RecurrenceChoice)
              }
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              onClick={addTaskForModalDate}
              disabled={!dayModalTaskTitle.trim()}
            >
              Add task
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {dayModalTasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No tasks scheduled for this day yet.
              </p>
            ) : (
              combineTasksWithPlaceholders(dayModalTasks, dayModalDate).map((item) =>
                item.kind === "task"
                  ? renderTaskRow(item.task)
                  : renderDeletedPlaceholder(item.placeholder)
              )
            )}
          </div>
        </div>
      </div>
    )}
    {isCreateModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-slate-900/40"
          onClick={() => {
            setIsCreateModalOpen(false);
            setBacklogError(null);
          }}
        />
        <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-semibold text-slate-900">Create a task</p>
              <p className="text-sm text-slate-500">
                Capture a task and optionally schedule it right away.
              </p>
            </div>
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600"
              onClick={() => {
                setIsCreateModalOpen(false);
                setBacklogError(null);
              }}
            >
              Close
            </button>
          </div>
          <div className="mt-5 space-y-3">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Task title"
              value={backlogTitle}
              onChange={(e) => setBacklogTitle(e.target.value)}
            />
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={backlogGoalId}
              onChange={(e) => setBacklogGoalId(e.target.value)}
            >
              <option value="">No goal link</option>
              {state.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Area / category (optional)"
                value={backlogCategory}
                onChange={(e) => setBacklogCategory(e.target.value)}
              />
              <input
                type="date"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                value={backlogDueDate}
                onChange={(e) => {
                  setBacklogDueDate(e.target.value);
                  setBacklogError(null);
                }}
              />
            </div>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={backlogRecurrence}
              onChange={(e) =>
                setBacklogRecurrence(e.target.value as RecurrenceChoice)
              }
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {backlogRecurrence !== "none" && (
              <p className="text-xs text-slate-500">
                We&apos;ll create repeating tasks for up to one year starting from the
                due date.
              </p>
            )}
            {recurringStartDateError && (
              <p className="text-xs font-semibold text-red-600">
                {recurringStartDateError}
              </p>
            )}
            {!recurringStartDateError && backlogError && (
              <p className="text-xs font-semibold text-red-600">{backlogError}</p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              onClick={handleSubmitNewTask}
              disabled={isSaveDisabled}
            >
              Save task
            </button>
            <button
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              onClick={() => {
                setIsCreateModalOpen(false);
                setBacklogError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
    </div>
    )}
    {pendingRecurringDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-slate-900/40"
          onClick={cancelRecurringDelete}
        />
        <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
          <p className="text-xl font-semibold text-slate-900">Delete recurring task?</p>
          <p className="mt-2 text-sm text-slate-600">
            Choose whether to delete just this task or every occurrence in the series.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => confirmRecurringDeletion("single")}
            >
              Delete just this one
            </button>
            <button
              className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              onClick={() => confirmRecurringDeletion("all")}
            >
              Delete all in series
            </button>
            <button
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              onClick={cancelRecurringDelete}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
