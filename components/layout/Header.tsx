"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export const PageHeader = ({
  title,
  subtitle,
  profileName,
  onGoToSettings,
}: {
  title: string;
  subtitle: string;
  profileName: string;
  onGoToSettings?: () => void;
}) => {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isDemo = !session;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const goToSettings = () => {
    if (onGoToSettings) {
      onGoToSettings();
    } else {
      router.replace("/app?view=settings");
    }
    setMenuOpen(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.replace("/auth/sign-in");
    router.refresh();
  };

  const showMenu = Boolean(session);

  const submitFeedback = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedbackStatus(null);
    if (!feedbackName.trim() || !feedbackEmail.trim() || !feedbackReason.trim()) {
      setFeedbackStatus({ type: "error", text: "Please fill in all fields." });
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName,
          email: feedbackEmail,
          reason: feedbackReason,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      setFeedbackStatus({ type: "success", text: "Thanks for the feedback!" });
      setFeedbackName("");
      setFeedbackEmail("");
      setFeedbackReason("");
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackStatus(null);
      }, 900);
    } catch (err) {
      console.error(err);
      setFeedbackStatus({
        type: "error",
        text: "Unable to send feedback right now. Please try again soon.",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          onClick={() => setFeedbackOpen(true)}
        >
          Report an issue / Feedback
        </button>
        {isDemo ? (
          <Link
            href="/auth/sign-up"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        ) : null}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs text-slate-500 transition hover:border-slate-200 hover:cursor-pointer"
            onClick={() => {
              if (showMenu) setMenuOpen((open) => !open);
            }}
            disabled={!showMenu}
          >
            <span className="block">Logged in as</span>
            <span className="text-sm font-semibold text-slate-900">
              {profileName}
            </span>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200 bg-white py-2 text-sm shadow-xl">
              <button
                type="button"
                className="flex w-full items-center px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                onClick={goToSettings}
              >
                Account settings
              </button>
              <button
                type="button"
                className="flex w-full items-center px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                onClick={signOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {feedbackOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setFeedbackOpen(false)}
          />
          <div className="relative z-50 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  Report an Issue or Give Feedback
                </p>
                <p className="text-sm text-slate-600">
                  Tell us what&apos;s broken or what we should improve.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                onClick={() => setFeedbackOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={submitFeedback}>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Your name"
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                />
                <input
                  type="email"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="you@example.com"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                />
              </div>
              <textarea
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                rows={4}
                placeholder="What happened or what should we improve?"
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
              />
              {feedbackStatus ? (
                <p
                  className={`text-sm ${
                    feedbackStatus.type === "success"
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {feedbackStatus.text}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmittingFeedback ? "Sending…" : "Submit feedback"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
};
