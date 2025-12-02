"use client";

import { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type NextStepEntry = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

const DEMO_STORAGE_KEY = "whylearn_demo_next_steps";

export const NextStepsView = () => {
  const { session } = useSupabase();
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<NextStepEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = Boolean(session);

  useEffect(() => {
    if (!isAuthenticated) {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        try {
          setEntries(JSON.parse(stored));
        } catch {
          setEntries([]);
        }
      }
      return;
    }

    const loadEntries = async () => {
      try {
        const response = await fetch("/api/next-steps");
        if (!response.ok) {
          throw new Error("Unable to load previous answers.");
        }
        const payload = (await response.json()) as { entries: NextStepEntry[] };
        setEntries(payload.entries);
      } catch (err) {
        console.error(err);
        setError("Unable to load your previous questions. Try again later.");
      }
    };
    loadEntries();
  }, [isAuthenticated]);

  const persistDemoEntries = (next: NextStepEntry[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    setIsSubmitting(true);
    setError(null);

    if (!isAuthenticated) {
      const entry: NextStepEntry = {
        id: crypto.randomUUID(),
        question: question.trim(),
        answer:
          "Here’s where your AI-powered next steps will appear. Connect your account to generate tailored guidance.",
        createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...entries];
      persistDemoEntries(updated);
      setEntries(updated);
      setQuestion("");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/next-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) {
        throw new Error("AI is not working now. Try again later.");
      }
      const data = (await response.json()) as { entry: NextStepEntry };
      setEntries((prev) => [data.entry, ...prev]);
      setQuestion("");
    } catch (err) {
      console.error(err);
      setError("AI is not working now. Please try again soon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          What are my next steps?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Ask anything about your goals, habits, schedule, or focus. AI is used to analyze your current goals, reflections, 
          finances, life scores, and will respond with conversational guidance followed by concrete,
          step-by-step next moves.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <textarea
            className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm"
            rows={4}
            placeholder="Where should I focus this week?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
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
            {isSubmitting ? "Thinking…" : "Ask the AI mentor"}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">
          Recent next steps
        </h3>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">
            You haven’t asked anything yet. Your answers will show up here.
          </p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  Q: {entry.question}
                </p>
                <ReactMarkdown>
                  {entry.answer}
                </ReactMarkdown>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
