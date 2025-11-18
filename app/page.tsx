"use client";

import { AppShell } from "@/components/AppShell";
import { AppStateProvider, useAppState } from "@/components/AppStateProvider";
import { OnboardingFlow } from "@/components/Onboarding";

const AppGate = () => {
  const { state, isHydrated } = useAppState();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading your Vision…
      </div>
    );
  }

  if (!state.profile.onboardingCompletedAt) {
    return <OnboardingFlow />;
  }

  return <AppShell />;
};

export default function HomePage() {
  return (
    <AppStateProvider>
      <AppGate />
    </AppStateProvider>
  );
}
