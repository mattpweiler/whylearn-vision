import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { appBaseUrl, getStripeClient } from "@/lib/stripe/server";

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
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing profile found for this account." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripeClient();
    const baseUrl = appBaseUrl(
      request.headers.get("origin") ??
        request.nextUrl.origin ??
        request.url
    );
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/paywall`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Failed to create billing portal session", err);
    return NextResponse.json(
      { error: "Unable to open billing portal." },
      { status: 500 }
    );
  }
};
