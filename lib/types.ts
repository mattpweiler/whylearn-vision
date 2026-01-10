import { GoalColor } from "@/lib/goalColors";

export type LifeAreaKey =
  | "career"
  | "money"
  | "health"
  | "relationships"
  | "mental"
  | "purpose";

export interface LifeArea {
  id: number;
  key: LifeAreaKey;
  name: string;
  description?: string;
  sortOrder: number;
}

export type CurrencyCode = "USD" | "GBP" | "EUR" | "CAD" | "MXN";

export interface LifeAreaScore {
  id: string;
  lifeAreaId: number;
  score: number;
  note?: string;
  createdAt: string;
}

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled"
  | "pending"
  | "completed";
export type PriorityLevel = "low" | "medium" | "high";
export type GoalStatus = "active" | "completed" | "archived";
export type HabitCadence = "daily" | "weekly" | "monthly" | "custom";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  lifeAreaId?: number;
  status: GoalStatus;
  priority: PriorityLevel;
  targetDate?: string;
  isStarred: boolean;
  createdAt: string;
  color: GoalColor;
  metricTarget?: number | null;
  metricOptOut?: boolean;
  metricManualTracking?: boolean;
  metricManualProgress?: number | null;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  lifeAreaId?: number;
  goalId?: string;
  cadence: HabitCadence;
  frequencyPerPeriod?: number;
  isActive: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  logDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  lifeAreaId?: number;
  goalId?: string;
  projectId?: string;
  habitId?: string;
  dueDate?: string;
  scheduledFor?: string;
  scheduledDate?: string | null;
  month?: string;
  recurrenceGroupId?: string;
  recurrenceCadence?: "weekly" | "monthly";
  recurrenceStartDate?: string;
  backlogCategory?: string;
  orderIndex: number;
  createdAt: string;
}

export type ReflectionType =
  | "onboarding"
  | "daily"
  | "weekly"
  | "monthly"
  | "crisis";

export interface Reflection {
  id: string;
  type: ReflectionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  moodScore?: number;
  energyScore?: number;
  primaryLifeAreaId?: number;
  createdAt: string;
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface AiSession {
  id: string;
  topic?: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  defaultHomeView: ViewKey;
  weekStartDay: 0 | 1;
  showLifeAreaSummaryOnToday: boolean;
  autoGenerateTasksFromAi: boolean;
  currency: CurrencyCode;
}

export interface Profile {
  displayName: string;
  timezone: string;
  onboardingCompletedAt?: string;
}

export interface AppState {
  profile: Profile;
  settings: UserSettings;
  lifeAreas: LifeArea[];
  lifeAreaScores: LifeAreaScore[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  reflections: Reflection[];
  aiSessions: AiSession[];
  dailyFocus: Record<string, string>;
}

export type ViewKey =
  | "today"
  | "planner"
  | "year"
  | "direction"
  | "financial_freedom"
  | "financial_profit"
  | "next_steps"
  | "feature_vote"
  | "settings";
