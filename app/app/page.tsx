"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppExperience } from "@/components/AppExperience";
import { AppStateProvider } from "@/components/AppStateProvider";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export default function AppWorkspacePage() {
  const { session, isLoading, supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/sign-in");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking your session…
      </div>
    );
  }

  return (
    <AppStateProvider
      mode="supabase"
      supabaseClient={supabase}
      userId={session.user.id}
    >
      <AppExperience />
    </AppStateProvider>
  );
}
