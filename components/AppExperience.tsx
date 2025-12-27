"use client";

import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/components/AppStateProvider";
import { OnboardingFlow } from "@/components/Onboarding";

export const AppExperience = () => {
  const { state, isHydrated, error } = useAppState();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div className="rounded-3xl border border-red-100 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-base font-semibold text-red-600">
            Something went wrong
          </p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div className="space-y-2 text-center">
          <p>Loading your Vision…</p>
          <p className="text-xs text-slate-500">
            If this hangs, email <a className="font-semibold text-slate-900" href="mailto:whylearnwednesdays@gmail.com">whylearnwednesdays@gmail.com</a> and we'll help. Try Refreshing the main app page as well.
          </p>
        </div>
      </div>
    );
  }

  if (!state.profile.onboardingCompletedAt) {
    return <OnboardingFlow />;
  }

  return <AppShell />;
};
