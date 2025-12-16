"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const createAdminClient = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    "";
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase configuration for feedback endpoint.");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const POST = async (request: NextRequest) => {
  try {
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

    const supabase = createAdminClient();
    const { error } = await supabase.from("feedback").insert({
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
