"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "@/lib/types";
import {
  STORAGE_KEY,
  currentTimezone,
  defaultSettings,
  generateId,
  monthLabel,
} from "@/lib/utils";
import { fetchSupabaseAppState } from "@/lib/supabase/data";
import { persistWorkspaceChanges } from "@/lib/supabase/persistence";
import { DEFAULT_LIFE_AREAS } from "@/lib/lifeAreas";

interface AppStateContextValue {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  resetState: () => void;
  isHydrated: boolean;
  error?: string | null;
}

const sampleGoals = () => [
  {
    id: generateId(),
    title: "Launch freelance design studio",
    description: "Build a client pipeline and hit $5k/mo",
    lifeAreaId: 1,
    status: "active" as const,
    priority: "high" as const,
    targetDate: new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .slice(0, 10),
    isStarred: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Dial in health baseline",
    description: "Consistent sleep, gym 4x/wk, better meals",
    lifeAreaId: 3,
    status: "active" as const,
    priority: "medium" as const,
    targetDate: new Date(new Date().getFullYear(), 8, 30)
      .toISOString()
      .slice(0, 10),
    isStarred: false,
    createdAt: new Date().toISOString(),
  },
];

const sampleHabits = () => [
  {
    id: generateId(),
    name: "Morning sunlight walk",
    description: "10 minutes outside before screens",
    lifeAreaId: 3,
    cadence: "daily" as const,
    frequencyPerPeriod: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Reach out to a friend",
    description: "Send a quick check-in text",
    lifeAreaId: 4,
    cadence: "daily" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const sampleTasks = () => {
  const today = new Date();
  const tzOffset = today.getTimezoneOffset();
  const localTime = new Date(today.getTime() - tzOffset * 60000)
    .toISOString()
    .slice(0, 10);
  const currentMonth = monthLabel(today);
  return [
    {
      id: generateId(),
      title: "Update portfolio hero section",
      status: "in_progress" as const,
      priority: "high" as const,
      lifeAreaId: 1,
      orderIndex: 1,
      scheduledFor: localTime,
      scheduledDate: localTime,
      month: currentMonth,
      createdAt: today.toISOString(),
    },
    {
      id: generateId(),
      title: "Book therapy intro session",
      status: "todo" as const,
      priority: "medium" as const,
      lifeAreaId: 5,
      orderIndex: 2,
      month: currentMonth,
      scheduledDate: null,
      createdAt: today.toISOString(),
    },
  ];
};

const createBaseState = (): AppState => ({
  profile: {
    displayName: "Demo",
    timezone: currentTimezone(),
    onboardingCompletedAt: new Date().toISOString(),
  },
  settings: defaultSettings(),
  lifeAreas: DEFAULT_LIFE_AREAS,
  lifeAreaScores: [],
  goals: sampleGoals(),
  habits: sampleHabits(),
  habitLogs: [],
  tasks: sampleTasks(),
  reflections: [],
  aiSessions: [],
  dailyFocus: {},
});

const createEmptyState = (): AppState => ({
  profile: {
    displayName: "",
    timezone: currentTimezone(),
    onboardingCompletedAt: undefined,
  },
  settings: defaultSettings(),
  lifeAreas: DEFAULT_LIFE_AREAS,
  lifeAreaScores: [],
  goals: [],
  habits: [],
  habitLogs: [],
  tasks: [],
  reflections: [],
  aiSessions: [],
  dailyFocus: {},
});

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined
);

export const AppStateProvider = ({
  children,
  mode = "demo",
  supabaseClient,
  userId,
}: {
  children: React.ReactNode;
  mode?: "demo" | "supabase";
  supabaseClient?: SupabaseClient;
  userId?: string;
}) => {
  const [state, setState] = useState<AppState>(() =>
    mode === "demo" ? createBaseState() : createEmptyState()
  );
  const [isHydrated, setIsHydrated] = useState(mode === "demo" ? false : false);
  const [error, setError] = useState<string | null>(null);
  const profileBootstrapRef = useRef(false);
  const settingsBootstrapRef = useRef(false);

  useEffect(() => {
    if (mode !== "demo" || typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AppState = JSON.parse(stored);
        setState(parsed);
      } else {
        const base = createBaseState();
        setState(base);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
      }
    } catch (err) {
      console.error("Failed to load saved state", err);
      setState(createBaseState());
    } finally {
      setIsHydrated(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "demo" || typeof window === "undefined" || !isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isHydrated, mode]);

  const loadSupabaseState = useCallback(async () => {
    if (!supabaseClient || !userId) return;
    setError(null);
    try {
      const result = await fetchSupabaseAppState(supabaseClient, userId);
      setState(result.state);
      profileBootstrapRef.current = !result.profileExists;
      settingsBootstrapRef.current = !result.settingsExists;
    } catch (err) {
      console.error("Failed to load Supabase state", err);
      const message =
        err instanceof Error ? err.message : "Unable to load workspace data.";
      setError(message);
    } finally {
      setIsHydrated(true);
    }
  }, [supabaseClient, userId]);

  useEffect(() => {
    if (mode !== "supabase") return;
    if (!supabaseClient || !userId) return;
    setIsHydrated(false);
    loadSupabaseState();
  }, [mode, supabaseClient, userId, loadSupabaseState]);

  const persistStateChanges = useCallback(
    (previous: AppState, nextState: AppState) => {
      if (mode !== "supabase" || !supabaseClient || !userId) {
        return;
      }
      persistWorkspaceChanges({
        supabase: supabaseClient,
        userId,
        previous,
        next: nextState,
        forceProfileUpsert: profileBootstrapRef.current,
        forceSettingsUpsert: settingsBootstrapRef.current,
      })
        .then(({ profileSynced, settingsSynced }) => {
          if (profileSynced) {
            profileBootstrapRef.current = false;
          }
          if (settingsSynced) {
            settingsBootstrapRef.current = false;
          }
        })
        .catch((err) => {
          console.error("Failed to persist workspace changes", err);
        });
    },
    [mode, supabaseClient, userId]
  );

  const previousStateRef = useRef<AppState | null>(null);
  const hasPersistedSinceHydrationRef = useRef(false);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => updater(prev));
  }, []);

  useEffect(() => {
    if (mode !== "supabase" || !supabaseClient || !userId || !isHydrated) {
      previousStateRef.current = state;
      hasPersistedSinceHydrationRef.current = false;
      return;
    }
    const previous = previousStateRef.current;
    if (
      !previous ||
      !hasPersistedSinceHydrationRef.current ||
      previous === state
    ) {
      previousStateRef.current = state;
      hasPersistedSinceHydrationRef.current = true;
      return;
    }
    persistStateChanges(previous, state);
    previousStateRef.current = state;
  }, [
    state,
    mode,
    supabaseClient,
    userId,
    isHydrated,
    persistStateChanges,
  ]);

  const resetState = useCallback(() => {
    if (mode === "demo") {
      const base = createBaseState();
      setState(base);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
      }
      setIsHydrated(true);
      return;
    }
    if (!supabaseClient || !userId) return;
    setIsHydrated(false);
    loadSupabaseState();
  }, [mode, loadSupabaseState, supabaseClient, userId]);

  return (
    <AppStateContext.Provider
      value={{ state, updateState, resetState, isHydrated, error }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
};
