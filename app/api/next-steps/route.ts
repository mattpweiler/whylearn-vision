import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

const createSupabaseServerClient = (request: NextRequest) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          /* no-op */
        },
        remove() {
          /* no-op */
        },
      },
    }
  );

const buildContextSummary = (payload: {
  profile?: Record<string, unknown> | null;
  goals: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  habits: Record<string, unknown>[];
  lifeAreas: Record<string, unknown>[];
  lifeAreaScores: Record<string, unknown>[];
  reflections: Record<string, unknown>[];
}) => {
  const lines: string[] = [];
  if (payload.profile) {
    lines.push(
      `Profile: ${payload.profile.display_name ?? "Friend"} in ${
        payload.profile.timezone ?? "unknown timezone"
      }`
    );
  }
  if (payload.lifeAreas.length) {
    lines.push(
      "Life Areas:",
      ...payload.lifeAreas.map((area) => {
        const score = payload.lifeAreaScores.find(
          (entry) => entry.life_area_id === area.id
        );
        return `- ${area.name}: ${score?.score ?? "n/a"}`;
      })
    );
  }
  if (payload.goals.length) {
    lines.push(
      "Goals:",
      ...payload.goals.map(
        (goal) =>
          `- ${goal.title} (${goal.status}) priority ${goal.priority}${
            goal.target_date ? ` target ${goal.target_date}` : ""
          }`
      )
    );
  }
  if (payload.tasks.length) {
    lines.push(
      "Tasks:",
      ...payload.tasks.map(
        (task) =>
          `- ${task.title} (${task.status}) due ${task.due_date ?? task.scheduled_for ?? "unscheduled"}`
      )
    );
  }
  if (payload.habits.length) {
    lines.push(
      "Habits:",
      ...payload.habits.map(
        (habit) => `- ${habit.name} (${habit.cadence ?? "daily"})`
      )
    );
  }
  if (payload.reflections.length) {
    lines.push(
      "Recent reflections:",
      ...payload.reflections.map((reflection) => {
        const summary =
          reflection.content?.note ??
          reflection.content?.focus ??
          reflection.content?.intent ??
          JSON.stringify(reflection.content);
        return `- ${reflection.type} : ${summary}`;
      })
    );
  }
  return lines.join("\n");
};

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("next_step_entries")
    .select("id, question, answer, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to load entries." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    entries: (data ?? []).map((item) => ({
      id: item.id,
      question: item.question ?? "",
      answer: item.answer ?? "",
      createdAt: item.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.question || typeof body.question !== "string") {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 }
    );
  }
  const supabase = createSupabaseServerClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI is not available right now." },
      { status: 500 }
    );
  }

  const [
    profileResult,
    goalsResult,
    tasksResult,
    habitsResult,
    lifeAreasResult,
    lifeAreaScoresResult,
    reflectionsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, timezone")
      .eq("user_id", session.user.id)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("id, title, status, priority, target_date")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, scheduled_for")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("habits")
      .select("id, name, cadence")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("life_areas")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_life_area_scores")
      .select("life_area_id, score, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("reflections")
      .select("type, content")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const context = buildContextSummary({
    profile: profileResult?.data ?? null,
    goals: goalsResult?.data ?? [],
    tasks: tasksResult?.data ?? [],
    habits: habitsResult?.data ?? [],
    lifeAreas: lifeAreasResult?.data ?? [],
    lifeAreaScores: lifeAreaScoresResult?.data ?? [],
    reflections: reflectionsResult?.data ?? [],
  });

  const prompt = `You are WhyLearn's personal coach. First provide a conversational response (2-3 paragraphs) referencing the user's context. Then provide a clear checklist of next steps with sections for Goals to add, Tasks to schedule, Habits to reinforce, and Daily Tips. Each action should be specific and doable.\n\nUser Context:\n${context}\n\nQuestion: ${body.question}`;

  let aiAnswer = "";
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a calm, encouraging, pragmatic life coach focused on helping people progress on their goals. Be candid but kind.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 700,
      }),
    });
    if (!response.ok) {
      throw new Error("OpenAI request failed");
    }
    const data = await response.json();
    aiAnswer = data.choices?.[0]?.message?.content?.trim();
    if (!aiAnswer) {
      throw new Error("Invalid AI response");
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "AI is not working now. Try again later." },
      { status: 500 }
    );
  }

  const entry: NextStepEntry = {
    id: crypto.randomUUID(),
    question: body.question.trim(),
    answer: aiAnswer,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("next_step_entries").insert({
    id: entry.id,
    user_id: session.user.id,
    question: entry.question,
    answer: entry.answer,
  });
  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save AI response." },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry }, { status: 200 });
}

type NextStepEntry = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};
