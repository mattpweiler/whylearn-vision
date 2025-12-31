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
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setResetStatus(null);
    setIsSubmitting(true);
    try {
      const payload = { email, password };
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (typeof window !== "undefined" ? window.location.origin : "");
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

      const { data, error: authError } = await supabase.auth.signUp({
        ...payload,
        options: {
          emailRedirectTo: `${baseUrl.replace(/\/$/, "")}/auth/confirm`,
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

  const sendPasswordReset = async () => {
    setError(null);
    setResetStatus(null);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!email) {
      setError("Enter your email to receive the reset link.");
      return;
    }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${baseUrl.replace(/\/$/, "")}/auth/reset-password`,
        }
      );
      if (resetError) throw resetError;
      setResetStatus("Password reset link sent. Check your email AND Spam Folder.");
    } catch (err) {
      console.error("Password reset request failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the reset link right now."
      );
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
        <div className="flex items-center justify-between text-sm">
          <Link
            href={copy.link}
            className="font-semibold text-slate-900"
          >
            {mode === "signIn" ? "Create one" : "Sign in"}
          </Link>
          {mode === "signIn" ? (
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900"
              onClick={sendPasswordReset}
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {resetStatus ? (
          <p className="text-sm text-emerald-700" role="status">
            {resetStatus}
          </p>
        ) : null}
        <p className="text-xs text-slate-500">
          If all else fails, email <a className="font-semibold text-slate-900" href="mailto:whylearnwednesdays@gmail.com">whylearnwednesdays@gmail.com</a> and we'll help.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/90 disabled:opacity-70"
        >
          {isSubmitting ? "Please wait…" : mode === "signIn" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        {copy.prompt}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        By continuing you agree to receive helpful reminders and onboarding
        notes about your Vision workspace.
      </p>
    </div>
  );
};
