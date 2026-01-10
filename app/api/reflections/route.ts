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

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit")) || 10));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    const { data, error, count } = await supabase
      .from("reflections")
      .select(
        "id, type, content, mood_score, energy_score, primary_life_area_id, created_at",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const reflections = (data ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      content: item.content ?? {},
      moodScore: item.mood_score ?? null,
      energyScore: item.energy_score ?? null,
      primaryLifeAreaId: item.primary_life_area_id ?? null,
      createdAt: item.created_at,
    }));

    const totalCount = count ?? reflections.length;
    const hasMore = offset + reflections.length < totalCount;

    return NextResponse.json({ reflections, hasMore, totalCount });
  } catch (err) {
    console.error("Failed to load reflections", err);
    return NextResponse.json(
      { error: "Failed to load reflections" },
      { status: 500 }
    );
  }
};
