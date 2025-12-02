import type { SupabaseClient } from "@supabase/supabase-js";
import { AppState, AiMessageRole, ViewKey } from "@/lib/types";
import { DEFAULT_LIFE_AREAS } from "@/lib/lifeAreas";
import { currentTimezone, defaultSettings } from "@/lib/utils";

type NullableRecord = Record<string, unknown> | null;

const parseWeekStart = (value?: number | null): 0 | 1 => {
  if (value === 0 || value === 1) return value;
  return 1;
};

const toAiRole = (value?: string | null): AiMessageRole => {
  if (value === "assistant" || value === "user") return value;
  return "assistant";
};

const allowedHomeViews: ViewKey[] = [
  "today",
  "planner",
  "year",
  "direction",
  "financial_freedom",
  "financial_profit",
  "settings",
];

const normalizeHomeView = (
  value: string | null | undefined,
  fallback: ViewKey
): ViewKey => {
  if (!value) return fallback;
  if (value === "financial") return "financial_freedom";
  if (value === "week" || value === "month" || value === "backlog") {
    return "planner";
  }
  if (allowedHomeViews.includes(value as ViewKey)) {
    return value as ViewKey;
  }
  return fallback;
};

const seedLifeAreasIfMissing = async (
  supabase: SupabaseClient
) => {
  const payload = DEFAULT_LIFE_AREAS.map((area) => ({
    key: area.key,
    name: area.name,
    description: area.description ?? null,
    sort_order: area.sortOrder ?? 0,
  }));
  const upsertResult = await supabase
    .from("life_areas")
    .upsert(payload, { onConflict: "key" });
  if (upsertResult.error) throw upsertResult.error;
  const { data, error } = await supabase
    .from("life_areas")
    .select("id, key, name, description, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export interface SupabaseAppStateResult {
  state: AppState;
  profileExists: boolean;
  settingsExists: boolean;
}

export const fetchSupabaseAppState = async (
  supabase: SupabaseClient,
  userId: string
): Promise<SupabaseAppStateResult> => {
  const defaults = defaultSettings();
  const [
    profileResult,
    settingsResult,
    lifeAreasResult,
    scoresResult,
    goalsResult,
    habitsResult,
    habitLogsResult,
    tasksResult,
    reflectionsResult,
    aiSessionsResult,
    aiMessagesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, timezone, onboarding_completed_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_settings")
      .select(
        "default_home_view, week_start_day, show_life_area_summary, auto_generate_tasks_from_ai"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("life_areas")
      .select("id, key, name, description, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_life_area_scores")
      .select("id, life_area_id, score, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("goals")
      .select(
        "id, title, description, life_area_id, status, priority, target_date, is_starred, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("habits")
      .select(
        "id, name, description, life_area_id, goal_id, cadence, frequency_per_period, is_active, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("habit_logs")
      .select("id, habit_id, log_date, completed, created_at")
      .eq("user_id", userId)
      .order("log_date", { ascending: false }),
    supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority, life_area_id, goal_id, habit_id, due_date, scheduled_for, order_index, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reflections")
      .select(
        "id, type, content, mood_score, energy_score, primary_life_area_id, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_sessions")
      .select("id, topic, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_messages")
      .select("id, session_id, role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const assertNoError = (result: { error?: Error | null }) => {
    if (result.error) throw result.error;
  };

  assertNoError(profileResult);
  assertNoError(settingsResult);
  assertNoError(lifeAreasResult);
  assertNoError(scoresResult);
  assertNoError(goalsResult);
  assertNoError(habitsResult);
  assertNoError(habitLogsResult);
  assertNoError(tasksResult);
  assertNoError(reflectionsResult);
  assertNoError(aiSessionsResult);
  assertNoError(aiMessagesResult);

  const profile = profileResult.data as NullableRecord;
  const settings = settingsResult.data as NullableRecord;

  const messagesBySession = (aiMessagesResult.data ?? []).reduce<
    Record<string, AppState["aiSessions"][number]["messages"]>
  >((acc, message) => {
    const key = message.session_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: message.id,
      role: toAiRole(message.role),
      content: message.content ?? "",
      createdAt: message.created_at,
    });
    return acc;
  }, {});

  let lifeAreaRows = lifeAreasResult.data ?? [];
  if (!lifeAreaRows || lifeAreaRows.length === 0) {
    try {
      lifeAreaRows = await seedLifeAreasIfMissing(supabase);
    } catch (err) {
      console.error("Failed to seed life areas", err);
      lifeAreaRows = [];
    }
  }

  const resolvedLifeAreas =
    lifeAreaRows.length > 0
      ? lifeAreaRows.map((item) => ({
          id: item.id,
          key: item.key,
          name: item.name,
          description: item.description ?? undefined,
          sortOrder: item.sort_order ?? 0,
        }))
      : DEFAULT_LIFE_AREAS;

  const state: any = {
    profile: {
      displayName:
        (profile?.display_name as string | null) ?? "Demo",
      timezone:
        (profile?.timezone as string | null) ?? currentTimezone(),
      onboardingCompletedAt: profile?.onboarding_completed_at
        ? String(profile?.onboarding_completed_at)
        : undefined,
    },
    settings: {
      defaultHomeView: normalizeHomeView(
        (settings?.default_home_view as string | null | undefined) ??
          undefined,
        defaults.defaultHomeView
      ),
      weekStartDay: parseWeekStart(
        (settings?.week_start_day as number | null | undefined) ?? undefined
      ),
      showLifeAreaSummaryOnToday:
        (settings?.show_life_area_summary as boolean | null) ??
        defaults.showLifeAreaSummaryOnToday,
      autoGenerateTasksFromAi:
        (settings?.auto_generate_tasks_from_ai as boolean | null) ??
        defaults.autoGenerateTasksFromAi,
    },
    lifeAreas: resolvedLifeAreas,
    lifeAreaScores: (scoresResult.data ?? []).map((item) => ({
      id: item.id,
      lifeAreaId: item.life_area_id,
      score: item.score,
      note: item.note ?? undefined,
      createdAt: item.created_at,
    })),
    goals: (goalsResult.data ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description ?? undefined,
      lifeAreaId: goal.life_area_id ?? undefined,
      status: goal.status,
      priority: goal.priority,
      targetDate: goal.target_date ?? undefined,
      isStarred: goal.is_starred ?? false,
      createdAt: goal.created_at,
    })),
    habits: (habitsResult.data ?? []).map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description ?? undefined,
      lifeAreaId: habit.life_area_id ?? undefined,
      goalId: habit.goal_id ?? undefined,
      cadence: habit.cadence,
      frequencyPerPeriod: habit.frequency_per_period ?? undefined,
      isActive: habit.is_active ?? false,
      createdAt: habit.created_at,
    })),
    habitLogs: (habitLogsResult.data ?? []).map((log) => ({
      id: log.id,
      habitId: log.habit_id,
      logDate: log.log_date,
      completed: log.completed ?? true,
      createdAt: log.created_at,
    })),
    tasks: (tasksResult.data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      status: task.status,
      priority: task.priority,
      lifeAreaId: task.life_area_id ?? undefined,
      goalId: task.goal_id ?? undefined,
      habitId: task.habit_id ?? undefined,
      dueDate: task.due_date ?? undefined,
      scheduledFor: task.scheduled_for ?? undefined,
      scheduledDate: task.scheduled_for ?? null,
      orderIndex: task.order_index ?? 0,
      createdAt: task.created_at,
    })),
    reflections: (reflectionsResult.data ?? []).map((reflection) => ({
      id: reflection.id,
      type: reflection.type,
      content: reflection.content ?? {},
      moodScore: reflection.mood_score ?? undefined,
      energyScore: reflection.energy_score ?? undefined,
      primaryLifeAreaId: reflection.primary_life_area_id ?? undefined,
      createdAt: reflection.created_at,
    })),
    aiSessions: (aiSessionsResult.data ?? []).map((session) => ({
      id: session.id,
      topic: session.topic ?? undefined,
      messages: messagesBySession[session.id] ?? [],
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    })),
    dailyFocus: {},
  };

  return {
    state,
    profileExists: Boolean(profileResult.data),
    settingsExists: Boolean(settingsResult.data),
  };
};
