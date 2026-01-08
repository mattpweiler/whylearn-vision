"use client";

import { useMemo, useState } from "react";
import { AppState } from "@/lib/types";
import { formatDisplayDate, generateId, todayKey } from "@/lib/utils";

const TrashIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M5 6l1.5 14A2 2 0 0 0 8.5 22h7a2 2 0 0 0 2-1.75L19 6" />
  </svg>
);

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const DirectionView = ({ state, updateState }: ViewProps) => {
  const lifeAreaStats = useMemo(() => {
    const map: Record<number, { score: number; createdAt: string }> = {};
    state.lifeAreas.forEach((area) => {
      map[area.id] = { score: 5, createdAt: "" };
    });
    state.lifeAreaScores.forEach((entry) => {
      const current = map[entry.lifeAreaId];
      if (!current || current.createdAt < entry.createdAt) {
        map[entry.lifeAreaId] = { score: entry.score, createdAt: entry.createdAt };
      }
    });
    return map;
  }, [state.lifeAreas, state.lifeAreaScores]);
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, number>>(() => {
    const defaults: Record<number, number> = {};
    state.lifeAreas.forEach((area) => {
      defaults[area.id] = lifeAreaStats[area.id]?.score ?? 5;
    });
    return defaults;
  });
  const [reflectionType, setReflectionType] = useState("weekly");
  const [reflectionNote, setReflectionNote] = useState("");
  const [reflectionDate, setReflectionDate] = useState(todayKey());
  const [dayQuality, setDayQuality] = useState(5);
  const [expandedReflectionIds, setExpandedReflectionIds] = useState<string[]>([]);
  const [editingReflectionId, setEditingReflectionId] = useState<string | null>(
    null
  );
  const [editingReflectionDraft, setEditingReflectionDraft] = useState<{
    note: string;
    date: string;
    dayQuality: number;
  }>({
    note: "",
    date: todayKey(),
    dayQuality: 5,
  });

  const logScoreChange = (areaId: number, value: number) => {
    updateState((prev) => ({
      ...prev,
      lifeAreaScores: [
        ...prev.lifeAreaScores,
        {
          id: generateId(),
          lifeAreaId: areaId,
          score: value,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const recentReflections = [...state.reflections]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 25);

  const toggleReflectionExpansion = (id: string) => {
    setExpandedReflectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const startReflectionEdit = (reflectionId: string) => {
    const target = state.reflections.find((item) => item.id === reflectionId);
    if (!target) return;
    const content = target.content ?? {};
    setEditingReflectionId(reflectionId);
    setEditingReflectionDraft({
      note: content.note ?? "",
      date: content.date ?? target.createdAt.slice(0, 10),
      dayQuality: content.dayQuality ?? target.moodScore ?? 5,
    });
    if (!expandedReflectionIds.includes(reflectionId)) {
      setExpandedReflectionIds((prev) => [...prev, reflectionId]);
    }
  };

  const cancelReflectionEdit = () => {
    setEditingReflectionId(null);
  };

  const saveReflectionEdit = () => {
    if (!editingReflectionId) return;
    updateState((prev) => ({
      ...prev,
      reflections: prev.reflections.map((reflection) =>
        reflection.id === editingReflectionId
          ? {
              ...reflection,
              content: {
                ...(reflection.content ?? {}),
                note: editingReflectionDraft.note,
                date: editingReflectionDraft.date,
                dayQuality: editingReflectionDraft.dayQuality,
              },
              moodScore: editingReflectionDraft.dayQuality,
            }
          : reflection
      ),
    }));
    setEditingReflectionId(null);
  };

  const deleteReflection = (reflectionId: string) => {
    updateState((prev) => ({
      ...prev,
      reflections: prev.reflections.filter((reflection) => reflection.id !== reflectionId),
    }));
  };

  const addReflection = () => {
    if (!reflectionNote.trim()) return;
    updateState((prev) => ({
      ...prev,
      reflections: [
        ...prev.reflections,
        {
          id: generateId(),
          type: reflectionType as "weekly" | "daily",
          content: {
            note: reflectionNote.trim(),
            date: reflectionDate,
            dayQuality,
          },
          moodScore: dayQuality,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setReflectionNote("");
    setDayQuality(5);
    setReflectionDate(todayKey());
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Life areas snapshot</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {state.lifeAreas.map((area) => (
            <div key={area.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{area.name}</p>
                <span className="text-xs text-slate-500">
                  {formatDisplayDate(lifeAreaStats[area.id]?.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {lifeAreaStats[area.id]?.score ?? "–"}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={scoreDrafts[area.id] ?? 5}
                className="mt-4 w-full"
                style={{ cursor: "pointer" }}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setScoreDrafts((prev) => ({
                    ...prev,
                    [area.id]: value,
                  }));
                  logScoreChange(area.id, value);
                }}
              />
            </div>
          ))}
        </div>
      </section>

      

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Reflections</p>
          <div className="mt-4 space-y-3">
          {recentReflections.map((reflection) => {
            const isExpanded = expandedReflectionIds.includes(reflection.id);
            const isEditing = editingReflectionId === reflection.id;
            const content = reflection.content ?? {};
            const summary = (() => {
              if (reflection.type === "onboarding") {
                const onboardingContent = content as Record<string, string>;
                const onboardingSummary =
                  onboardingContent.downloadReason ||
                  onboardingContent.currentFeeling ||
                  onboardingContent.note ||
                  onboardingContent.displayName;
                return onboardingSummary || "Onboarding responses";
              }
              return (
                (content as Record<string, string>).focus ||
                (content as Record<string, string>).intent ||
                (content as Record<string, string>).note ||
                (content as Record<string, string>).message ||
                "Captured"
              );
            })();
            return (
              <div
                key={reflection.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="flex-1 text-left transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleReflectionExpansion(reflection.id)}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {reflection.type}
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {summary}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDisplayDate(reflection.createdAt)}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 p-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleReflectionExpansion(reflection.id)}
                        aria-label={isExpanded ? "Collapse reflection" : "Expand reflection"}
                      >
                        {isExpanded ? "−" : "+"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full p-2 text-rose-500 transition hover:bg-rose-50"
                        style={{ cursor: "pointer" }}
                        onClick={() => deleteReflection(reflection.id)}
                        aria-label="Delete reflection"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded ? (
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-sm text-slate-700">
                      {isEditing ? (
                        <>
                          <input
                            type="date"
                            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                            value={editingReflectionDraft.date}
                            onChange={(e) =>
                              setEditingReflectionDraft((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                          <textarea
                            className="min-h-[160px] w-full rounded-2xl border border-slate-200 p-3 text-sm"
                            value={editingReflectionDraft.note}
                            onChange={(e) =>
                              setEditingReflectionDraft((prev) => ({
                                ...prev,
                                note: e.target.value,
                              }))
                            }
                            placeholder="What’s on your mind?"
                          />
                          <label className="block text-xs font-medium text-slate-500">
                            Day rating {editingReflectionDraft.dayQuality}/10
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={editingReflectionDraft.dayQuality}
                              onChange={(e) =>
                                setEditingReflectionDraft((prev) => ({
                                  ...prev,
                                  dayQuality: Number(e.target.value),
                                }))
                              }
                              className="mt-2 w-full"
                            />
                          </label>
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              className="flex-1 rounded-2xl bg-slate-900 px-3 py-2 font-semibold text-white transition hover:bg-slate-800"
                              style={{ cursor: "pointer" }}
                              onClick={saveReflectionEdit}
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              style={{ cursor: "pointer" }}
                              onClick={cancelReflectionEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>
                            <span className="font-medium text-slate-900">
                              Date:
                            </span>{" "}
                            {formatDisplayDate(content.date ?? reflection.createdAt)}
                          </p>
                          {content.dayQuality ?? reflection.moodScore ? (
                            <p>
                              <span className="font-medium text-slate-900">
                                Day score:
                              </span>{" "}
                              {content.dayQuality ?? reflection.moodScore}/10
                            </p>
                          ) : null}
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-900 underline transition hover:text-slate-700"
                            style={{ cursor: "pointer" }}
                            onClick={() => startReflectionEdit(reflection.id)}
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {recentReflections.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No reflections yet.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">New reflection</p>
          <div className="mt-4 space-y-3">
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={reflectionType}
              onChange={(e) => setReflectionType(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={reflectionDate}
              onChange={(e) => setReflectionDate(e.target.value)}
              style={{ cursor: "pointer" }}
            />
            <textarea
              className="h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm"
              placeholder="What's on your mind"
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              style={{ cursor: "pointer" }}
            />
            <label className="block text-sm font-medium text-slate-600">
              Did you have a good day today? {dayQuality}/10
              <input
                type="range"
                min={1}
                max={10}
                value={dayQuality}
                onChange={(e) => setDayQuality(Number(e.target.value))}
                className="mt-2 w-full"
                style={{ cursor: "pointer" }}
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              style={{ cursor: "pointer" }}
              onClick={addReflection}
            >
              Save reflection
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
