import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSubscriptionActive } from "@/lib/stripe/utils";

export const dynamic = "force-dynamic";

const createSupabaseRouteClient = (request: NextRequest) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      "",
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
  const supabase = createSupabaseRouteClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "status, price_id, current_period_end, stripe_customer_id, stripe_subscription_id"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subscription", error);
    return NextResponse.json(
      { error: "Unable to load subscription." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    subscription: data ?? null,
    isActive: isSubscriptionActive(
      data?.status,
      data?.current_period_end ?? null
    ),
  });
};
