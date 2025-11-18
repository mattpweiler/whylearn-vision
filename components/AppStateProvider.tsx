"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, LifeArea } from "@/lib/types";
import {
  STORAGE_KEY,
  currentTimezone,
  defaultSettings,
  generateId,
} from "@/lib/utils";

interface AppStateContextValue {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  resetState: () => void;
  isHydrated: boolean;
}

const baseLifeAreas: LifeArea[] = [
  { id: 1, key: "career", name: "Career", sortOrder: 1 },
  { id: 2, key: "money", name: "Money", sortOrder: 2 },
  { id: 3, key: "health", name: "Health", sortOrder: 3 },
  { id: 4, key: "relationships", name: "Relationships", sortOrder: 4 },
  { id: 5, key: "mental", name: "Mental", sortOrder: 5 },
  { id: 6, key: "purpose", name: "Purpose", sortOrder: 6 },
];

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
  return [
    {
      id: generateId(),
      title: "Update portfolio hero section",
      status: "in_progress" as const,
      priority: "high" as const,
      lifeAreaId: 1,
      orderIndex: 1,
      scheduledFor: localTime,
      createdAt: today.toISOString(),
    },
    {
      id: generateId(),
      title: "Book therapy intro session",
      status: "todo" as const,
      priority: "medium" as const,
      lifeAreaId: 5,
      orderIndex: 2,
      scheduledFor: localTime,
      createdAt: today.toISOString(),
    },
  ];
};

const createBaseState = (): AppState => ({
  profile: {
    displayName: "Friend",
    timezone: currentTimezone(),
  },
  settings: defaultSettings(),
  lifeAreas: baseLifeAreas,
  lifeAreaScores: [],
  goals: sampleGoals(),
  habits: sampleHabits(),
  habitLogs: [],
  tasks: sampleTasks(),
  reflections: [],
  aiSessions: [],
  dailyFocus: {},
});

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined
);

export const AppStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<AppState>(createBaseState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isHydrated]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => updater(prev));
  }, []);

  const resetState = useCallback(() => {
    const base = createBaseState();
    setState(base);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    }
  }, []);

  return (
    <AppStateContext.Provider
      value={{ state, updateState, resetState, isHydrated }}
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
