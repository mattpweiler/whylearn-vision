"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

const ConfirmEmailContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();

  useEffect(() => {
    // If Supabase sent a code, try to exchange it for a session; otherwise just redirect after showing the message.
    const exchangeSession = async () => {
      const code = searchParams.get("code");
      if (!code) return;
      try {
        await supabase.auth.exchangeCodeForSession(code);
      } catch (err) {
        console.error("Email confirmation session exchange failed", err);
      }
    };
    void exchangeSession();

    const timer = setTimeout(() => {
      router.replace("/auth/sign-in");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Email confirmed
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          You&apos;re all set
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          We confirmed your email. Redirecting you to sign in so you can access your workspace.
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/auth/sign-in"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Go to sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          If the redirect doesn&apos;t happen automatically, use the button above.
        </p>
      </div>
    </div>
  );
};

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
