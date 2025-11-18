import { Task, UserSettings } from "@/lib/types";

export const STORAGE_KEY = "whylearn_lifeos_state_v1";

export const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const todayKey = () => formatDateKey(new Date());

export const formatDateKey = (date: Date) => {
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const monthKey = (date: Date) => formatDateKey(date).slice(0, 7);

export const formatDisplayDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const startOfWeek = (date: Date, weekStart: 0 | 1) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStart ? 7 : 0) + day - weekStart;
  result.setDate(result.getDate() - diff);
  return normalizeDate(result);
};

export const endOfWeek = (date: Date, weekStart: 0 | 1) => {
  const start = startOfWeek(date, weekStart);
  start.setDate(start.getDate() + 6);
  return normalizeDate(start);
};

export const weekDateKeys = (date: Date, weekStart: 0 | 1) => {
  const start = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return formatDateKey(d);
  });
};

export const normalizeDate = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const isWithinRange = (value?: string, start?: string, end?: string) => {
  if (!value || !start || !end) return false;
  return value >= start && value <= end;
};

export const tasksForMonth = (tasks: Task[], key: string) =>
  tasks
    .filter(
      (task) =>
        task.scheduledFor?.startsWith(key) || task.dueDate?.startsWith(key)
    )
    .sort((a, b) => {
      const aDate = a.scheduledFor ?? a.dueDate ?? "";
      const bDate = b.scheduledFor ?? b.dueDate ?? "";
      return aDate.localeCompare(bDate);
    });

export const sortTasks = (tasks: Task[]) =>
  [...tasks].sort((a, b) => a.orderIndex - b.orderIndex);

export const tasksByDateWithinRange = (
  tasks: Task[],
  start: string,
  end: string
) => {
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    if (task.scheduledFor && isWithinRange(task.scheduledFor, start, end)) {
      if (!grouped[task.scheduledFor]) grouped[task.scheduledFor] = [];
      grouped[task.scheduledFor].push(task);
    }
  });
  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortTasks(grouped[key]);
  });
  return grouped;
};

export const currentTimezone = () => {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
};

export const defaultSettings = (): UserSettings => ({
  defaultHomeView: "today",
  weekStartDay: 1,
  showLifeAreaSummaryOnToday: true,
  autoGenerateTasksFromAi: false,
});
