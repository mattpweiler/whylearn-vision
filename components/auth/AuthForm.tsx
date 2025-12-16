"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type AuthMode = "signIn" | "signUp";

const titles: Record<AuthMode, { heading: string; prompt: string; link: string }> =
  {
    signIn: {
      heading: "Welcome back",
      prompt: "Need an account?",
      link: "/auth/sign-up",
    },
    signUp: {
      heading: "Create your workspace",
      prompt: "Already have an account?",
      link: "/auth/sign-in",
    },
  };

export const AuthForm = ({ mode }: { mode: AuthMode }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveBaseUrl = () => {
    if (typeof window !== "undefined") return window.location.origin;
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.APP_URL ??
      "http://localhost:3000"
    );
  };

  const resolveRedirectTarget = (override?: string) => {
    if (override) return override;
    const target = searchParams.get("redirectTo");
    if (target && target.startsWith("/")) {
      return target;
    }
    return "/app";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = { email, password };
      if (mode === "signIn") {
        const { error: authError } = await supabase.auth.signInWithPassword(
          payload
        );
        if (authError) {
          throw authError;
        }
        const destination = resolveRedirectTarget();
        router.replace(destination);
        router.refresh();
        return;
      }

      const target = resolveRedirectTarget("/paywall");
      const emailRedirectTo = `${resolveBaseUrl()}${target}`;
      const { data, error: authError } = await supabase.auth.signUp({
        ...payload,
        options: {
          emailRedirectTo,
        },
      });
      if (authError) {
        throw authError;
      }
      if (!data.session) {
        const params = new URLSearchParams({ email });
        router.replace(`/auth/check-email?${params.toString()}`);
        return;
      }
      router.replace(resolveRedirectTarget("/paywall"));
      router.refresh();
    } catch (err) {
      console.error("Authentication failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t complete that request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = titles[mode];

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      <p className="text-sm font-semibold text-slate-500">
        WhyLearn Vision access
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        {copy.heading}
      </h1>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            required
            className="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/90 disabled:opacity-70"
        >
          {isSubmitting ? "Please wait…" : mode === "signIn" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        {copy.prompt}{" "}
        <Link href={copy.link} className="font-semibold text-slate-900">
          {mode === "signIn" ? "Create one" : "Sign in"}
        </Link>
      </p>
      <p className="mt-2 text-xs text-slate-400">
        By continuing you agree to receive helpful reminders and onboarding
        notes about your Vision workspace.
      </p>
    </div>
  );
};
