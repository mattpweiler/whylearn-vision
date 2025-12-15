"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/components/AppStateProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/Header";
import { DirectionView } from "@/components/views/DirectionView";
import { FinancialFreedomView } from "@/components/views/FinancialFreedomView";
import { PlannerView } from "@/components/views/PlannerView";
import { SettingsView } from "@/components/views/SettingsView";
import { TodayView } from "@/components/views/TodayView";
import { YearGoalsView } from "@/components/views/YearGoalsView";
import { MonthlyProfitView } from "@/components/views/MonthlyProfitView";
import { NextStepsView } from "@/components/views/NextStepsView";
import { ViewKey } from "@/lib/types";
import { useSupabase } from "@/components/providers/SupabaseProvider";

const meta: Record<ViewKey, { title: string; subtitle: string }> = {
  today: {
    title: "Today",
    subtitle: "Just do these things TODAY. Commit to them.",
  },
  planner: {
    title: "Planner",
    subtitle: "Plan the week or month, drag in tasks, and stay on rhythm.",
  },
  year: {
    title: "Year Goals",
    subtitle: "Only You Decide How Successful Your Year Is",
  },
  direction: {
    title: "Direction & Purpose",
    subtitle: "Life areas, reflections, and AI mentor.",
  },
  next_steps: {
    title: "What Are My Next Steps?",
    subtitle: "Ask a question and capture AI-generated action items.",
  },
  financial_freedom: {
    title: "Financial Planner",
    subtitle: "Stay close to your cash flow and net worth trajectory.",
  },
  financial_profit: {
    title: "Monthly Profit",
    subtitle: "Log actual income vs. expenses and measure profit trends.",
  },
  settings: {
    title: "Settings",
    subtitle: "Profile, preferences, and defaults.",
  },
};

const viewOrder: ViewKey[] = [
  "today",
  "planner",
  "year",
  "direction",
  "financial_freedom",
  "financial_profit",
  "settings",
];

const DEMO_ALLOWED_VIEW_SET = new Set<ViewKey>(["today", "planner"]);

export const AppShell = () => {
  const { state, updateState, mode } = useAppState();
  const isDemo = mode === "demo";
  const COMING_SOON_VIEW: ViewKey = "next_steps";

  const resolvedDefaultView = useMemo(() => {
    const desired = (state.settings.defaultHomeView ??
      "today") as ViewKey | "week" | "month" | "backlog";
    const normalized: ViewKey =
      desired === "week" || desired === "month" || desired === "backlog"
        ? "planner"
        : desired;
    if (normalized === COMING_SOON_VIEW) {
      return "today";
    }
    if (isDemo && !DEMO_ALLOWED_VIEW_SET.has(normalized)) {
      return "today";
    }
    return normalized;
  }, [state.settings.defaultHomeView, isDemo]);

  const [currentView, setCurrentView] = useState<ViewKey>(
    resolvedDefaultView
  );

  useEffect(() => {
    setCurrentView(resolvedDefaultView);
  }, [resolvedDefaultView]);

  const handleSelectView = (next: ViewKey) => {
    if (next === COMING_SOON_VIEW) return;
    if (isDemo && !DEMO_ALLOWED_VIEW_SET.has(next)) return;
    setCurrentView(next);
  };

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  const activeMeta = meta[currentView];

  const viewComponent = (() => {
    switch (currentView) {
      case "planner":
        return <PlannerView state={state} updateState={updateState} />;
      case "year":
        return <YearGoalsView state={state} updateState={updateState} />;
      case "direction":
        return <DirectionView state={state} updateState={updateState} />;
      case "financial_freedom":
        return <FinancialFreedomView />;
      case "financial_profit":
        return <MonthlyProfitView />;
      case "next_steps":
        return <NextStepsView />;
      case "settings":
        return <SettingsView state={state} updateState={updateState} />;
      case "today":
      default:
        return <TodayView state={state} updateState={updateState} />;
    }
  })();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar current={currentView} onSelect={handleSelectView} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-10">
        <div className="lg:hidden">
          <select
            value={currentView}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            onChange={(e) => handleSelectView(e.target.value as ViewKey)}
          >
            {viewOrder.map((item) => (
              <option
                key={item}
                value={item}
                disabled={
                  item === COMING_SOON_VIEW ||
                  (isDemo && !DEMO_ALLOWED_VIEW_SET.has(item))
                }
              >
                {meta[item].title}
                {item === COMING_SOON_VIEW ? " (coming soon)" : ""}
              </option>
            ))}
          </select>
        </div>
        <PageHeader
          title={currentView === "today" ? todayLabel : activeMeta.title}
          subtitle={activeMeta.subtitle}
          profileName={state.profile.displayName}
        />
        <section>{viewComponent}</section>
      </main>
    </div>
  );
};
