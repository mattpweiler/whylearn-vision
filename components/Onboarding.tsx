"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/AppStateProvider";
import { generateId, todayKey } from "@/lib/utils";

const questions = [
  {
    key: "betterFuture",
    label:
      "If your life felt clearly better 12 months from now, what changed?",
  },
  {
    key: "worry",
    label: "What are you most worried about right now?",
  },
  {
    key: "bigGoal",
    label: "What's one big goal you have for the next year?",
  },
] as const;

export const OnboardingFlow = () => {
  const { state, updateState } = useAppState();
  const lifeAreas = useMemo(
    () => [...state.lifeAreas].sort((a, b) => a.sortOrder - b.sortOrder),
    [state.lifeAreas]
  );
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    const defaults: Record<number, number> = {};
    lifeAreas.forEach((area) => {
      defaults[area.id] = 5;
    });
    return defaults;
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleComplete = () => {
    const now = new Date().toISOString();
    const today = todayKey();
    updateState((prev) => ({
      ...prev,
      profile: { ...prev.profile, onboardingCompletedAt: now },
      lifeAreaScores: [
        ...prev.lifeAreaScores,
        ...lifeAreas.map((area) => ({
          id: generateId(),
          lifeAreaId: area.id,
          score: ratings[area.id] ?? 5,
          note: "Initial onboarding check-in",
          createdAt: now,
        })),
      ],
      reflections: [
        ...prev.reflections,
        {
          id: generateId(),
          type: "onboarding",
          content: {
            ...answers,
            ratedOn: today,
          },
          createdAt: now,
        },
      ],
    }));
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-6 text-center max-w-xl">
          <p className="text-3xl font-semibold text-slate-900">
            Welcome to WhyLearn OS
          </p>
          <p className="text-lg text-slate-600">
            This app helps you go from “I don’t know what I’m doing” to a clear
            plan for today, this week, this month, and your year.
          </p>
          <button
            className="w-full rounded-xl bg-slate-900 py-3 text-white"
            onClick={() => setStep(2)}
          >
            Let’s start
          </button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="w-full max-w-2xl space-y-6">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              Rate each life area (1-10)
            </p>
            <p className="text-slate-600">
              Quick gut check so we can tailor your plan.
            </p>
          </div>
          <div className="space-y-4">
            {lifeAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{area.name}</p>
                    <p className="text-sm text-slate-500">
                      How are you doing here?
                    </p>
                  </div>
                  <div className="text-xl font-semibold text-slate-800">
                    {ratings[area.id] ?? 5}/10
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratings[area.id] ?? 5}
                  className="mt-4 w-full"
                  onChange={(e) =>
                    setRatings((prev) => ({
                      ...prev,
                      [area.id]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            Quick reflection
          </p>
          <p className="text-slate-600">
            Capture what matters before we build your plan.
          </p>
        </div>
        <div className="space-y-4">
          {questions.map((q) => (
            <label key={q.key} className="block">
              <span className="text-sm font-medium text-slate-800">
                {q.label}
              </span>
              <textarea
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                rows={3}
                value={answers[q.key] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.key]: e.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700"
            onClick={() => setStep(2)}
          >
            Back
          </button>
          <button
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-white"
            onClick={handleComplete}
          >
            Launch my dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-10 shadow-xl">
        {renderStep()}
      </div>
    </div>
  );
};
