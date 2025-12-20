"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/components/AppStateProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MobileActions } from "@/components/layout/MobileActions";
import { DirectionView } from "@/components/views/DirectionView";
import { FinancialFreedomView } from "@/components/views/FinancialFreedomView";
import { PlannerView } from "@/components/views/PlannerView";
import { SettingsView } from "@/components/views/SettingsView";
import { TodayView } from "@/components/views/TodayView";
import { YearGoalsView } from "@/components/views/YearGoalsView";
import { MonthlyProfitView } from "@/components/views/MonthlyProfitView";
import { NextStepsView } from "@/components/views/NextStepsView";
import { FeatureVoteView } from "@/components/views/FeatureVoteView";
import { ViewKey } from "@/lib/types";
import { DEMO_ALLOWED_VIEWS } from "@/components/layout/navConfig";

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
  feature_vote: {
    title: "Vote on Next Feature",
    subtitle: "Tell us what to build next. One vote per customer.",
  },
  settings: {
    title: "Settings",
    subtitle: "Profile, preferences, and defaults.",
  },
};

const DEMO_ALLOWED_VIEW_SET = new Set<ViewKey>(DEMO_ALLOWED_VIEWS);

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
        return <FinancialFreedomView readOnly={isDemo} />;
      case "financial_profit":
        return <MonthlyProfitView readOnly={isDemo} />;
      case "next_steps":
        return <NextStepsView />;
      case "feature_vote":
        return <FeatureVoteView />;
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
        <div className="flex items-center justify-between lg:hidden">
          <MobileMenu
            currentView={currentView}
            onSelect={handleSelectView}
            isDemo={isDemo}
            comingSoonView={COMING_SOON_VIEW}
            compact
          />
          <MobileActions
            profileName={state.profile.displayName}
            onGoToSettings={() => handleSelectView("settings")}
          />
        </div>
        <div className="hidden lg:block">
          <PageHeader
            title={currentView === "today" ? todayLabel : activeMeta.title}
            subtitle={activeMeta.subtitle}
            profileName={state.profile.displayName}
          />
        </div>
        <section>{viewComponent}</section>
      </main>
    </div>
  );
};
