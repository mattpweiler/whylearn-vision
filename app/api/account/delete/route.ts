"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

export const POST = async (request: NextRequest) => {
  try {
    const supabase = createSupabaseServerClient(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to delete account" },
      { status: 500 }
    );
  }
};
