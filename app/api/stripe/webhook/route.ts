import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  getStripeClient,
  getWebhookSecret,
} from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const toIsoDate = (timestamp?: number | null) =>
  timestamp ? new Date(timestamp * 1000).toISOString() : null;

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
    console.error("[stripe-webhook] Failed to upsert subscription", {
      error,
      payload,
    });
    throw error;
  }
};

const syncFromStripeSubscription = async (
  subscription: Stripe.Subscription,
  explicitUserId?: string | null
) => {
  const userId =
    explicitUserId ??
    (subscription.metadata?.user_id as string | undefined) ??
    (await lookupUserIdByStripeRefs(subscription));

  if (!userId) {
    console.warn("Subscription missing user_id metadata", subscription.id);
    return;
  }

  await upsertSubscription({
    userId,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    stripeSubscriptionId: subscription.id,
    // Treat cancel_at_period_end as effectively cancelled for access purposes.
    status: subscription.cancel_at_period_end ? "canceled" : subscription.status,
    priceId: subscription.items.data?.[0]?.price?.id ?? null,
    currentPeriodEnd: subscription.current_period_end,
  });
};

const lookupUserIdByStripeRefs = async (subscription: Stripe.Subscription) => {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id")
      .or(
        [
          `stripe_subscription_id.eq.${subscription.id}`,
          typeof subscription.customer === "string"
            ? `stripe_customer_id.eq.${subscription.customer}`
            : null,
        ]
          .filter(Boolean)
          .join(",")
      )
      .maybeSingle();
    if (error) {
      console.error("[stripe-webhook] lookup by stripe refs failed", error);
      return null;
    }
    return data?.user_id ?? null;
  } catch (err) {
    console.error("[stripe-webhook] failed user lookup by stripe refs", err);
    return null;
  }
};

export const POST = async (request: NextRequest) => {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature ?? "",
      webhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature validation failed", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[stripe-webhook] checkout.session.completed", {
          id: session.id,
          subscription: session.subscription,
        });
        if (!session.subscription || !session.customer) break;
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.toString()
        );
        const userId =
          (session.metadata?.user_id as string | undefined) ??
          (subscription.metadata?.user_id as string | undefined) ??
          (session.client_reference_id as string | undefined) ??
          null;
        console.log("[stripe-webhook] resolved checkout user", {
          userId: Boolean(userId) ? "resolved" : "missing",
          subscriptionId: subscription.id,
        });
        await syncFromStripeSubscription(subscription, userId);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[stripe-webhook] subscription event", {
          type: event.type,
          id: subscription.id,
          status: subscription.status,
        });
        await syncFromStripeSubscription(subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler failed", {
      error: err,
      eventType: event?.type,
    });
    // Always acknowledge to prevent endless retries; alerts will surface via logs.
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
};
