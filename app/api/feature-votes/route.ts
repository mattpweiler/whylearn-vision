"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { findFeatureVoteOption } from "@/lib/featureVotes";

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

const MAX_MESSAGE_LENGTH = 1000;

const normalizeVote = (row: {
  feature_key: string;
  feature_label: string | null;
  message: string | null;
  created_at: string;
}) => ({
  featureKey: row.feature_key,
  featureLabel: row.feature_label ?? findFeatureVoteOption(row.feature_key)?.title ?? row.feature_key,
  message: row.message,
  createdAt: row.created_at,
});

export const GET = async (request: NextRequest) => {
  try {
    const supabase = createSupabaseServerClient(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("feature_votes")
      .select("feature_key, feature_label, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[feature-votes] fetch failed", error);
      return NextResponse.json({ error: "Unable to load vote" }, { status: 500 });
    }

    return NextResponse.json({ vote: data ? normalizeVote(data) : null });
  } catch (err) {
    console.error("[feature-votes] unexpected error", err);
    return NextResponse.json({ error: "Unable to load vote" }, { status: 500 });
  }
};

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

    const payload = (await request.json().catch(() => ({}))) as {
      featureKey?: string;
      message?: string;
    };

    const featureKey = (payload.featureKey ?? "").trim();
    const message = (payload.message ?? "").trim();

    const selectedFeature = findFeatureVoteOption(featureKey);
    if (!selectedFeature) {
      return NextResponse.json({ error: "Invalid feature selection" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Message is too long" }, { status: 413 });
    }

    const { data: existingVote, error: existingError } = await supabase
      .from("feature_votes")
      .select("feature_key, feature_label, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("[feature-votes] existing vote check failed", existingError);
      return NextResponse.json({ error: "Unable to submit vote" }, { status: 500 });
    }

    if (existingVote) {
      return NextResponse.json(
        { error: "You already voted", vote: normalizeVote(existingVote) },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("feature_votes")
      .insert({
        user_id: user.id,
        feature_key: selectedFeature.key,
        feature_label: selectedFeature.title,
        message: message || null,
      })
      .select("feature_key, feature_label, message, created_at")
      .single();

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "You already voted" }, { status: 409 });
      }
      console.error("[feature-votes] insert failed", error);
      return NextResponse.json({ error: "Unable to submit vote" }, { status: 500 });
    }

    return NextResponse.json({ vote: normalizeVote(data) });
  } catch (err) {
    console.error("[feature-votes] unexpected error", err);
    return NextResponse.json({ error: "Unable to submit vote" }, { status: 500 });
  }
};
