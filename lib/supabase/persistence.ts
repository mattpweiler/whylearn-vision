import type { SupabaseClient } from "@supabase/supabase-js";
import { AiMessage, AppState } from "@/lib/types";

type TaskRow = ReturnType<typeof serializeTask>;
type GoalRow = ReturnType<typeof serializeGoal>;
type HabitRow = ReturnType<typeof serializeHabit>;
type HabitLogRow = ReturnType<typeof serializeHabitLog>;
type ReflectionRow = ReturnType<typeof serializeReflection>;
type LifeAreaScoreRow = ReturnType<typeof serializeLifeAreaScore>;
type AiSessionRow = ReturnType<typeof serializeAiSession>;
type AiMessageRow = ReturnType<typeof serializeAiMessage>;

const deepEqual = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

const asDateOrNull = (value?: string | null) => value ?? null;
const asTextOrNull = (value?: string | null) =>
  value === undefined ? null : value;

const serializeTask = (task: AppState["tasks"][number], userId: string) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  description: asTextOrNull(task.description),
  status: task.status,
  priority: task.priority,
  life_area_id: task.lifeAreaId ?? null,
  goal_id: task.goalId ?? null,
  habit_id: task.habitId ?? null,
  due_date: asDateOrNull(task.dueDate),
  scheduled_for:
    asDateOrNull(task.scheduledDate) ?? asDateOrNull(task.scheduledFor),
  order_index: task.orderIndex ?? 0,
  created_at: task.createdAt,
});

const serializeGoal = (goal: AppState["goals"][number], userId: string) => ({
  id: goal.id,
  user_id: userId,
  title: goal.title,
  description: asTextOrNull(goal.description),
  life_area_id: goal.lifeAreaId ?? null,
  status: goal.status,
  priority: goal.priority,
  target_date: asDateOrNull(goal.targetDate),
  is_starred: goal.isStarred ?? false,
  created_at: goal.createdAt,
});

const serializeHabit = (
  habit: AppState["habits"][number],
  userId: string
) => ({
  id: habit.id,
  user_id: userId,
  name: habit.name,
  description: asTextOrNull(habit.description),
  life_area_id: habit.lifeAreaId ?? null,
  goal_id: habit.goalId ?? null,
  cadence: habit.cadence,
  frequency_per_period: habit.frequencyPerPeriod ?? null,
  is_active: habit.isActive,
  created_at: habit.createdAt,
});

const serializeHabitLog = (
  log: AppState["habitLogs"][number],
  userId: string
) => ({
  id: log.id,
  user_id: userId,
  habit_id: log.habitId,
  log_date: log.logDate,
  completed: log.completed,
  created_at: log.createdAt,
});

const serializeLifeAreaScore = (
  score: AppState["lifeAreaScores"][number],
  userId: string
) => ({
  id: score.id,
  user_id: userId,
  life_area_id: score.lifeAreaId,
  score: score.score,
  note: asTextOrNull(score.note),
  created_at: score.createdAt,
});

const serializeReflection = (
  reflection: AppState["reflections"][number],
  userId: string
) => ({
  id: reflection.id,
  user_id: userId,
  type: reflection.type,
  content: reflection.content ?? {},
  mood_score: reflection.moodScore ?? null,
  energy_score: reflection.energyScore ?? null,
  primary_life_area_id: reflection.primaryLifeAreaId ?? null,
  created_at: reflection.createdAt,
});

const serializeAiSession = (
  session: AppState["aiSessions"][number],
  userId: string
) => ({
  id: session.id,
  user_id: userId,
  topic: asTextOrNull(session.topic),
  created_at: session.createdAt,
  updated_at: session.updatedAt,
});

const serializeAiMessage = (
  message: AiMessage,
  sessionId: string,
  userId: string
) => ({
  id: message.id,
  session_id: sessionId,
  user_id: userId,
  role: message.role,
  content: message.content,
  created_at: message.createdAt,
});

const serializeProfile = (state: AppState, userId: string) => ({
  user_id: userId,
  display_name: asTextOrNull(state.profile.displayName),
  timezone: asTextOrNull(state.profile.timezone),
  onboarding_completed_at: asDateOrNull(state.profile.onboardingCompletedAt),
});

const serializeSettings = (state: AppState, userId: string) => ({
  user_id: userId,
  default_home_view: state.settings.defaultHomeView,
  week_start_day: state.settings.weekStartDay,
  show_life_area_summary: state.settings.showLifeAreaSummaryOnToday,
  auto_generate_tasks_from_ai: state.settings.autoGenerateTasksFromAi,
});

const diffCollection = <T extends { id: string }, R extends Record<string, unknown>>(
  previous: T[],
  next: T[],
  mapper: (item: T) => R
) => {
  const prevMap = new Map<string, R>();
  previous.forEach((item) => {
    prevMap.set(item.id, mapper(item));
  });
  const upserts: R[] = [];
  const deletions: string[] = [];

  next.forEach((item) => {
    const serialized = mapper(item);
    const prior = prevMap.get(item.id);
    if (!prior || !deepEqual(prior, serialized)) {
      upserts.push(serialized);
    }
    prevMap.delete(item.id);
  });

  prevMap.forEach((_value, key) => {
    deletions.push(key);
  });

  return { upserts, deletions };
};

const findNewItems = <T extends { id: string }, R extends Record<string, unknown>>(
  previous: T[],
  next: T[],
  mapper: (item: T) => R
) => {
  const prevIds = new Set(previous.map((item) => item.id));
  return next
    .filter((item) => !prevIds.has(item.id))
    .map((item) => mapper(item));
};

interface PersistArgs {
  supabase: SupabaseClient;
  userId: string;
  previous: AppState;
  next: AppState;
  forceProfileUpsert?: boolean;
  forceSettingsUpsert?: boolean;
}

export const persistWorkspaceChanges = async ({
  supabase,
  userId,
  previous,
  next,
  forceProfileUpsert,
  forceSettingsUpsert,
}: PersistArgs) => {
  const profileSynced = await syncProfile({
    supabase,
    previous,
    next,
    userId,
    force: Boolean(forceProfileUpsert),
  });
  const settingsSynced = await syncSettings({
    supabase,
    previous,
    next,
    userId,
    force: Boolean(forceSettingsUpsert),
  });
  await syncGoals({ supabase, previous, next, userId });
  await syncHabits({ supabase, previous, next, userId });
  await syncTasks({ supabase, previous, next, userId });
  await syncHabitLogs({ supabase, previous, next, userId });
  await syncLifeAreaScores({ supabase, previous, next, userId });
  await syncReflections({ supabase, previous, next, userId });
  await syncAiSessions({ supabase, previous, next, userId });
  await syncAiMessages({ supabase, previous, next, userId });
  return { profileSynced, settingsSynced };
};

const syncProfile = async ({
  supabase,
  previous,
  next,
  userId,
  force,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
  force: boolean;
}) => {
  const prevPayload = serializeProfile(previous, userId);
  const nextPayload = serializeProfile(next, userId);
  if (!force && deepEqual(prevPayload, nextPayload)) {
    return false;
  }
  await supabase
    .from("profiles")
    .upsert(
      { ...nextPayload, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  return true;
};

const syncSettings = async ({
  supabase,
  previous,
  next,
  userId,
  force,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
  force: boolean;
}) => {
  const prevPayload = serializeSettings(previous, userId);
  const nextPayload = serializeSettings(next, userId);
  if (!force && deepEqual(prevPayload, nextPayload)) {
    return false;
  }
  await supabase
    .from("user_settings")
    .upsert(nextPayload, { onConflict: "user_id" });
  return true;
};

const syncGoals = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const { upserts, deletions } = diffCollection(
    previous.goals,
    next.goals,
    (goal) => serializeGoal(goal, userId)
  );
  if (upserts.length > 0) {
    await supabase.from("goals").upsert(upserts as GoalRow[]);
  }
  if (deletions.length > 0) {
    await supabase.from("goals").delete().in("id", deletions);
  }
};

const syncHabits = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const { upserts, deletions } = diffCollection(
    previous.habits,
    next.habits,
    (habit) => serializeHabit(habit, userId)
  );
  if (upserts.length > 0) {
    await supabase.from("habits").upsert(upserts as HabitRow[]);
  }
  if (deletions.length > 0) {
    await supabase.from("habits").delete().in("id", deletions);
  }
};

const syncTasks = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const { upserts, deletions } = diffCollection(
    previous.tasks,
    next.tasks,
    (task) => serializeTask(task, userId)
  );
  if (upserts.length > 0) {
    await supabase.from("tasks").upsert(upserts as TaskRow[]);
  }
  if (deletions.length > 0) {
    await supabase.from("tasks").delete().in("id", deletions);
  }
};

const syncHabitLogs = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const { upserts, deletions } = diffCollection(
    previous.habitLogs,
    next.habitLogs,
    (log) => serializeHabitLog(log, userId)
  );
  if (upserts.length > 0) {
    await supabase.from("habit_logs").upsert(upserts as HabitLogRow[]);
  }
  if (deletions.length > 0) {
    await supabase.from("habit_logs").delete().in("id", deletions);
  }
};

const syncLifeAreaScores = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const newScores = findNewItems(
    previous.lifeAreaScores,
    next.lifeAreaScores,
    (score) => serializeLifeAreaScore(score, userId)
  );
  if (newScores.length > 0) {
    await supabase
      .from("user_life_area_scores")
      .insert(newScores as LifeAreaScoreRow[]);
  }
};

const syncReflections = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const { upserts, deletions } = diffCollection(
    previous.reflections,
    next.reflections,
    (reflection) => serializeReflection(reflection, userId)
  );
  if (upserts.length > 0) {
    await supabase
      .from("reflections")
      .upsert(upserts as ReflectionRow[]);
  }
  if (deletions.length > 0) {
    await supabase.from("reflections").delete().in("id", deletions);
  }
};

const syncAiSessions = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const { upserts, deletions } = diffCollection(
    previous.aiSessions,
    next.aiSessions,
    (session) => serializeAiSession(session, userId)
  );
  if (upserts.length > 0) {
    await supabase
      .from("ai_sessions")
      .upsert(upserts as AiSessionRow[]);
  }
  if (deletions.length > 0) {
    await supabase.from("ai_messages").delete().in("session_id", deletions);
    await supabase.from("ai_sessions").delete().in("id", deletions);
  }
};

const flattenMessages = (state: AppState) =>
  state.aiSessions.flatMap((session) =>
    session.messages.map((message) => ({ sessionId: session.id, message }))
  );

const syncAiMessages = async ({
  supabase,
  previous,
  next,
  userId,
}: {
  supabase: SupabaseClient;
  previous: AppState;
  next: AppState;
  userId: string;
}) => {
  const prior = flattenMessages(previous);
  const current = flattenMessages(next);
  const prevIds = new Set(prior.map((item) => item.message.id));
  const newMessages = current
    .filter((item) => !prevIds.has(item.message.id))
    .map((item) => serializeAiMessage(item.message, item.sessionId, userId));
  if (newMessages.length > 0) {
    await supabase
      .from("ai_messages")
      .insert(newMessages as AiMessageRow[]);
  }
};
