import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const toIsoDate = (timestamp?: number | null) =>
  timestamp ? new Date(timestamp * 1000).toISOString() : null;

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

const createSupabaseServiceClient = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role configuration.");
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const upsertSubscription = async (payload: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  priceId?: string | null;
  currentPeriodEnd?: number | null;
}) => {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: payload.userId,
        stripe_customer_id: payload.stripeCustomerId ?? null,
        stripe_subscription_id: payload.stripeSubscriptionId ?? null,
        status: payload.status ?? null,
        price_id: payload.priceId ?? null,
        current_period_end: toIsoDate(payload.currentPeriodEnd),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[stripe-sync] Failed to upsert subscription", {
      error,
      payload,
    });
    throw error;
  }
};

export const POST = async (request: NextRequest) => {
  const supabase = createSupabaseRouteClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing Stripe session id." },
      { status: 400 }
    );
  }
  if (sessionId.includes("CHECKOUT_SESSION_ID")) {
    return NextResponse.json(
      { error: "Invalid placeholder session id." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (
      checkoutSession.client_reference_id &&
      checkoutSession.client_reference_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Session does not belong to this user." },
        { status: 403 }
      );
    }

    const subscriptionId = checkoutSession.subscription;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No subscription found on session." },
        { status: 400 }
      );
    }

    const subscription =
      typeof subscriptionId === "string"
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : (checkoutSession.subscription as Stripe.Subscription);

    await upsertSubscription({
      userId: user.id,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null,
      stripeSubscriptionId: subscription.id,
      status: subscription.cancel_at_period_end
        ? "canceled"
        : subscription.status,
      priceId: subscription.items.data?.[0]?.price?.id ?? null,
      currentPeriodEnd: subscription.current_period_end,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe-sync] Failed to sync from session", err);
    return NextResponse.json(
      { error: "Unable to sync subscription right now." },
      { status: 500 }
    );
  }
};
