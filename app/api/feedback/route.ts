"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

const MAX_REASON_LENGTH = 2_000;
const FEEDBACK_COOLDOWN_MS = 60 * 1000;

export const POST = async (request: NextRequest) => {
  try {
    const supabase = createSupabaseServerClient(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      reason?: string;
    };
    const name = (payload.name ?? "").trim();
    const email = (payload.email ?? "").trim();
    const reason = (payload.reason ?? "").trim();

    if (!name || !email || !reason) {
      return NextResponse.json(
        { error: "Name, email, and feedback are required." },
        { status: 400 }
      );
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: "Feedback is too long." },
        { status: 413 }
      );
    }

    const { data: recentSubmission } = await supabase
      .from("feedback")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      recentSubmission?.created_at &&
      Date.now() - new Date(recentSubmission.created_at).getTime() <
        FEEDBACK_COOLDOWN_MS
    ) {
      return NextResponse.json(
        { error: "You are sending feedback too quickly. Please wait a moment." },
        { status: 429 }
      );
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      name,
      email,
      reason,
    });

    if (error) {
      console.error("[feedback] insert failed", error);
      return NextResponse.json(
        { error: "Unable to save feedback right now." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] unexpected error", err);
    return NextResponse.json(
      { error: "Unable to save feedback right now." },
      { status: 500 }
    );
  }
};
