"use client";

import { useEffect, useMemo, useState } from "react";
import { FEATURE_VOTE_OPTIONS } from "@/lib/featureVotes";

type VoteRecord = {
  featureKey: string;
  featureLabel: string;
  message: string | null;
  createdAt: string;
};

export const FeatureVoteView = () => {
  const [selectedKey, setSelectedKey] = useState(
    FEATURE_VOTE_OPTIONS[0]?.key ?? ""
  );
  const [message, setMessage] = useState("");
  const [existingVote, setExistingVote] = useState<VoteRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasVoted = Boolean(existingVote);
  const activeSelection = useMemo(() => {
    if (hasVoted && existingVote) return existingVote.featureKey;
    if (selectedKey) return selectedKey;
    return FEATURE_VOTE_OPTIONS[0]?.key ?? "";
  }, [hasVoted, existingVote, selectedKey]);

  useEffect(() => {
    const loadExistingVote = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/feature-votes");
        if (!response.ok) {
          if (response.status === 401) {
            setError("Sign in to vote.");
            return;
          }
          throw new Error("Unable to load vote");
        }
        const payload = (await response.json()) as { vote?: VoteRecord | null };
        if (payload.vote) {
          setExistingVote(payload.vote);
          setSelectedKey(payload.vote.featureKey);
          setMessage(payload.vote.message ?? "");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your vote right now. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadExistingVote();
  }, []);

  const selectedFeature = useMemo(
    () => FEATURE_VOTE_OPTIONS.find((item) => item.key === activeSelection),
    [activeSelection]
  );

  const formattedVoteDate = existingVote
    ? new Date(existingVote.createdAt).toLocaleString()
    : null;

  const submitVote = async () => {
    if (!activeSelection || hasVoted) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    const note = message.trim();

    try {
      const response = await fetch("/api/feature-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey: activeSelection, message: note }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        vote?: VoteRecord;
        error?: string;
      };

      if (!response.ok) {
        if (payload.vote) {
          setExistingVote(payload.vote);
        }
        setError(payload.error ?? "Unable to save your vote right now.");
        return;
      }

      if (payload.vote) {
        setExistingVote(payload.vote);
        setMessage(payload.vote.message ?? "");
        setSuccess("Thanks! Your vote has been recorded.");
      } else {
        setSuccess("Thanks! Your vote has been recorded.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to save your vote right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !existingVote) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading your voting status…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Thank you for being a customer
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Help decide what we build next!
        </h2>

        {existingVote ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="text-lg">✅</span>
            <div>
              <p className="font-semibold">Vote recorded</p>
              <p className="text-emerald-900">
                You chose {existingVote.featureLabel}. {formattedVoteDate ? `Recorded ${formattedVoteDate}.` : ""}
              </p>
              {existingVote.message ? (
                <p className="mt-2 rounded-xl bg-white/60 px-3 py-2 text-slate-700">
                  “{existingVote.message}”
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-2 text-xs font-semibold text-slate-700">
            <span className="text-base">🗳️</span>
            One vote per account so we know what matters most.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void submitVote();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURE_VOTE_OPTIONS.map((option) => {
              const isSelected = activeSelection === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`flex h-full flex-col rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-800"
                  } ${hasVoted ? "cursor-not-allowed opacity-80" : ""}`}
                  onClick={() => {
                    if (hasVoted) return;
                    setSelectedKey(option.key);
                  }}
                  disabled={hasVoted}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-base font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {option.title}
                      </p>
                      <p className={`mt-2 text-sm leading-relaxed ${isSelected ? "text-slate-100/90" : "text-slate-600"}`}>
                        {option.description}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-900">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${
                    isSelected
                      ? "border-white/60 bg-white/10 text-white"
                      : "border-slate-100 bg-slate-50 text-slate-700"
                  }`}>
                    {option.impact}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800" htmlFor="vote-message">
              Don't Like Either Feature? Tell us a new idea to build
            </label>
            <textarea
              id="vote-message"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800"
              rows={3}
              placeholder="Share a quick note or use case so we build it right."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={hasVoted}
            />
            {hasVoted && selectedFeature?.impact ? (
              <p className="text-xs text-slate-500">
                Want to change your vote? Reply to our welcome email and we'll update it for you.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm font-semibold text-emerald-700" role="status">
              {success}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Your vote goes straight into our roadmap table. No spam, no extra emails.
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={hasVoted || isSubmitting || !activeSelection}
            >
              {hasVoted
                ? "Vote recorded"
                : isSubmitting
                  ? "Submitting…"
                  : selectedFeature
                    ? `Submit vote for ${selectedFeature.title}`
                    : "Submit vote"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
