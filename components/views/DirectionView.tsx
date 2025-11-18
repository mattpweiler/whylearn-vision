"use client";

import { useMemo, useState } from "react";
import { AiMessage, AppState } from "@/lib/types";
import { formatDisplayDate, generateId, todayKey } from "@/lib/utils";

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
  const dailyHabits = state.habits.filter((habit) => habit.cadence === "daily");
  const [reflectionType, setReflectionType] = useState("weekly");
  const [reflectionContent, setReflectionContent] = useState("");
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [aiMessage, setAiMessage] = useState("");
  const [habitDraft, setHabitDraft] = useState({
    name: "",
    description: "",
    lifeAreaId: "",
  });

  const updateScore = (areaId: number) => {
    updateState((prev) => ({
      ...prev,
      lifeAreaScores: [
        ...prev.lifeAreaScores,
        {
          id: generateId(),
          lifeAreaId: areaId,
          score: scoreDrafts[areaId] ?? 5,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const recentReflections = [...state.reflections]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  const addReflection = () => {
    if (!reflectionContent.trim()) return;
    updateState((prev) => ({
      ...prev,
      reflections: [
        ...prev.reflections,
        {
          id: generateId(),
          type: reflectionType as "weekly" | "crisis",
          content: {
            note: reflectionContent.trim(),
            date: todayKey(),
          },
          moodScore: mood,
          energyScore: energy,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setReflectionContent("");
  };

  const session = state.aiSessions[0];
  const messages: AiMessage[] = session?.messages ?? [];

  const updateHabit = (
    habitId: string,
    changes: Partial<{
      name: string;
      description?: string;
      lifeAreaId?: number;
      isActive: boolean;
    }>
  ) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) =>
        habit.id === habitId ? { ...habit, ...changes } : habit
      ),
    }));
  };

  const removeHabit = (habitId: string) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.filter((habit) => habit.id !== habitId),
      habitLogs: prev.habitLogs.filter((log) => log.habitId !== habitId),
    }));
  };

  const addDailyHabit = () => {
    if (!habitDraft.name.trim()) return;
    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: generateId(),
          name: habitDraft.name.trim(),
          description: habitDraft.description?.trim() || undefined,
          lifeAreaId: habitDraft.lifeAreaId
            ? Number(habitDraft.lifeAreaId)
            : undefined,
          cadence: "daily" as const,
          frequencyPerPeriod: 1,
          isActive: true,
          createdAt: now,
        },
      ],
    }));
    setHabitDraft({ name: "", description: "", lifeAreaId: "" });
  };

  const fakeResponse = (input: string) =>
    `Thanks for sharing. Choose one tiny action linked to that: “${input.slice(
      0,
      60
    )}${input.length > 60 ? "…" : ""}” and drop it into your Week view.`;

  const sendAiMessage = () => {
    if (!aiMessage.trim()) return;
    const now = new Date().toISOString();
    const userMessage: AiMessage = {
      id: generateId(),
      role: "user",
      content: aiMessage.trim(),
      createdAt: now,
    };
    const assistantMessage: AiMessage = {
      id: generateId(),
      role: "assistant",
      content: fakeResponse(aiMessage.trim()),
      createdAt: now,
    };
    updateState((prev) => {
      let sessions = [...prev.aiSessions];
      if (!session) {
        sessions = [
          {
            id: generateId(),
            topic: "Mentor Chat",
            messages: [],
            createdAt: now,
            updatedAt: now,
          },
          ...sessions,
        ];
      }
      const target = sessions[0];
      const updated = {
        ...target,
        messages: [...target.messages, userMessage, assistantMessage],
        updatedAt: now,
      };
      sessions[0] = updated;
      return { ...prev, aiSessions: sessions };
    });
    setAiMessage("");
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
                onChange={(e) =>
                  setScoreDrafts((prev) => ({
                    ...prev,
                    [area.id]: Number(e.target.value),
                  }))
                }
              />
              <button
                className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                onClick={() => updateScore(area.id)}
              >
                Update score
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">Daily habits</p>
            <p className="text-sm text-slate-500">
              Tweak the reps you track on Today view.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {dailyHabits.map((habit) => (
            <div
              key={habit.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3"
            >
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={habit.name}
                onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={2}
                value={habit.description ?? ""}
                onChange={(e) =>
                  updateHabit(habit.id, { description: e.target.value })
                }
              />
              <div className="flex flex-wrap gap-3">
                <select
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={habit.lifeAreaId ? habit.lifeAreaId.toString() : ""}
                  onChange={(e) =>
                    updateHabit(habit.id, {
                      lifeAreaId: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">Any area</option>
                  {state.lifeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={habit.isActive}
                    onChange={(e) => updateHabit(habit.id, { isActive: e.target.checked })}
                  />
                  Active
                </label>
                <button
                  className="text-sm text-slate-500 hover:text-red-500"
                  onClick={() => removeHabit(habit.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {dailyHabits.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No daily habits yet. Add one below to start tracking.
            </p>
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Add new habit</p>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Habit name"
            value={habitDraft.name}
            onChange={(e) => setHabitDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            rows={2}
            placeholder="Description (optional)"
            value={habitDraft.description}
            onChange={(e) =>
              setHabitDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={habitDraft.lifeAreaId}
            onChange={(e) =>
              setHabitDraft((prev) => ({ ...prev, lifeAreaId: e.target.value }))
            }
          >
            <option value="">Any area</option>
            {state.lifeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <button
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={addDailyHabit}
          >
            + Add daily habit
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Reflections</p>
          <div className="mt-4 space-y-3">
            {recentReflections.map((reflection) => (
              <div key={reflection.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {reflection.type}
                </p>
                <p className="text-sm text-slate-700">
                  {reflection.content?.focus || reflection.content?.intent ||
                    reflection.content?.note || "Captured"}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDisplayDate(reflection.createdAt)}
                </p>
              </div>
            ))}
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
            >
              <option value="weekly">Weekly</option>
              <option value="crisis">Crisis</option>
            </select>
            <textarea
              className="h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm"
              placeholder="What’s alive for you right now?"
              value={reflectionContent}
              onChange={(e) => setReflectionContent(e.target.value)}
            />
            <div className="flex gap-4 text-xs text-slate-600">
              <label className="flex-1">
                Mood {mood}/10
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="flex-1">
                Energy {energy}/10
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              onClick={addReflection}
            >
              Save reflection
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">AI mentor (demo)</p>
        <div className="mt-4 max-h-72 space-y-3 overflow-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl p-3 text-sm ${
                msg.role === "assistant" ? "bg-slate-100" : "bg-indigo-50"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {msg.role === "assistant" ? "Mentor" : "You"}
              </p>
              <p className="text-slate-700">{msg.content}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Start the conversation and we’ll fake an AI reply for now.
            </p>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <input
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Ask your mentor anything…"
            value={aiMessage}
            onChange={(e) => setAiMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
          />
          <button
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
            onClick={sendAiMessage}
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
};
