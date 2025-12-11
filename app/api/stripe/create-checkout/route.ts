import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  appBaseUrl,
  getStripeClient,
  getStripePriceId,
} from "@/lib/stripe/server";

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

export const POST = async (request: NextRequest) => {
  const supabase = createSupabaseRouteClient(request);
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = getStripePriceId();
  if (!priceId) {
    return NextResponse.json(
      { error: "Missing STRIPE_PRICE_ID configuration." },
      { status: 500 }
    );
  }

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const redirectTo = request.nextUrl.searchParams.get("redirectTo");
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : "/app";

  const baseUrl = appBaseUrl(
    request.headers.get("origin") ??
      request.nextUrl.origin ??
      request.url
  );

  const successUrl = new URL("/paywall", baseUrl);
  successUrl.searchParams.set("success", "true");
  successUrl.searchParams.set("redirectTo", safeRedirect);

  const cancelUrl = new URL("/paywall", baseUrl);
  cancelUrl.searchParams.set("canceled", "true");
  cancelUrl.searchParams.set("redirectTo", safeRedirect);

  try {
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      customer: subscriptionRow?.stripe_customer_id ?? undefined,
      customer_email: subscriptionRow?.stripe_customer_id
        ? undefined
        : session.user.email ?? undefined,
      metadata: { user_id: session.user.id },
      subscription_data: {
        metadata: { user_id: session.user.id },
      },
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Failed to create checkout session", err);
    return NextResponse.json(
      { error: "Unable to start checkout right now." },
      { status: 500 }
    );
  }
};
