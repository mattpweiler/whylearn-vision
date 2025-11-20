"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/AppStateProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/Header";
import { DirectionView } from "@/components/views/DirectionView";
import { FinancialPlannerView } from "@/components/views/FinancialPlannerView";
import { MonthView } from "@/components/views/MonthView";
import { SettingsView } from "@/components/views/SettingsView";
import { TodayView } from "@/components/views/TodayView";
import { WeekView } from "@/components/views/WeekView";
import { YearGoalsView } from "@/components/views/YearGoalsView";
import { ViewKey } from "@/lib/types";

const meta: Record<ViewKey, { title: string; subtitle: string }> = {
  today: {
    title: "Today",
    subtitle: "Just do these things TODAY. Commit to them.",
  },
  week: {
    title: "This Week",
    subtitle: "Lock in your rhythm and top 3 priorities this Week",
  },
  month: {
    title: "This Month",
    subtitle: "Projects, milestones, and medium-range planning.",
  },
  year: {
    title: "Year Goals",
    subtitle: "Only You Decide How Successful Your Year Is",
  },
  direction: {
    title: "Direction & Purpose",
    subtitle: "Life areas, reflections, and AI mentor.",
  },
  financial: {
    title: "Financial Planner",
    subtitle: "Stay close to your cash flow and net worth trajectory.",
  },
  settings: {
    title: "Settings",
    subtitle: "Profile, preferences, and defaults.",
  },
};

const viewOrder: ViewKey[] = [
  "today",
  "week",
  "month",
  "year",
  "direction",
  "financial",
  "settings",
];

export const AppShell = () => {
  const { state, updateState } = useAppState();
  const [currentView, setCurrentView] = useState<ViewKey>(
    state.settings.defaultHomeView ?? "today"
  );

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
      case "week":
        return <WeekView state={state} updateState={updateState} />;
      case "month":
        return <MonthView state={state} updateState={updateState} />;
      case "year":
        return <YearGoalsView state={state} updateState={updateState} />;
      case "direction":
        return <DirectionView state={state} updateState={updateState} />;
      case "financial":
        return (
          <FinancialPlannerView state={state} updateState={updateState} />
        );
      case "settings":
        return <SettingsView state={state} updateState={updateState} />;
      case "today":
      default:
        return <TodayView state={state} updateState={updateState} />;
    }
  })();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar current={currentView} onSelect={setCurrentView} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-10">
        <div className="lg:hidden">
          <select
            value={currentView}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            onChange={(e) => setCurrentView(e.target.value as ViewKey)}
          >
            {viewOrder.map((item) => (
              <option key={item} value={item}>
                {meta[item].title}
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
