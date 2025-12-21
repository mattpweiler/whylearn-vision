"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { isSubscriptionActive } from "@/lib/stripe/utils";

type SubscriptionRow = {
  status?: string | null;
  price_id?: string | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

type SubscriptionResponse = {
  subscription: SubscriptionRow | null;
  isActive: boolean;
};

const featureList = [
  "Goal planning, habit tracking, and reflections",
  "Financial Freedom Calculator and Monthly Profit Tracker",
  "Productivity helpers to help you plan and win each day"
];

const PaywallContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading: isAuthLoading } = useSupabase();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = useMemo(() => {
    if (!searchParams) return "/app";
    const target = searchParams.get("redirectTo");
    if (target && target.startsWith("/")) return target;
    return "/app";
  }, [searchParams]);

  const statusMessage = useMemo(() => {
    if (searchParams?.get("success")) {
      return "Payment successful. Finalizing your workspace…";
    }
    if (searchParams?.get("canceled")) {
      return "Checkout canceled. You can restart anytime.";
    }
    return null;
  }, [searchParams]);

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = searchParams?.get("session_id");
      if (
        searchParams?.get("success") &&
        sessionId &&
        !sessionId.includes("CHECKOUT_SESSION_ID")
      ) {
        await fetch(`/api/stripe/sync-subscription?session_id=${sessionId}`, {
          method: "POST",
        }).catch((err) =>
          console.error("Subscription sync from session failed", err)
        );
      }

      const response = await fetch("/api/stripe/subscription");
      if (!response.ok) {
        throw new Error("Unable to load your billing status.");
      }
      const json = (await response.json()) as SubscriptionResponse;
      setSubscription(json.subscription);
      if (json.isActive) {
        router.replace(destination);
        return;
      }
    } catch (err) {
      console.error("Failed to load subscription", err);
      setError(
        err instanceof Error ? err.message : "Could not load billing status."
      );
    } finally {
      setIsLoading(false);
    }
  }, [destination, router]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!session) {
      router.replace("/auth/sign-in?redirectTo=/paywall");
      return;
    }
    void fetchSubscription();
  }, [fetchSubscription, isAuthLoading, router, session]);

  const startCheckout = async () => {
    setIsRedirecting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stripe/create-checkout?redirectTo=${encodeURIComponent(destination)}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error("Unable to start checkout.");
      }
      const { url } = (await response.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      console.error("Checkout failed", err);
      setError(
        err instanceof Error ? err.message : "Unable to start checkout."
      );
      setIsRedirecting(false);
    }
  };

  const openBillingPortal = async () => {
    setIsRedirecting(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Unable to open billing portal.");
      }
      const { url } = (await response.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      console.error("Billing portal failed", err);
      setError(
        err instanceof Error ? err.message : "Unable to open billing portal."
      );
      setIsRedirecting(false);
    }
  };

  const hasActiveSubscription = isSubscriptionActive(
    subscription?.status,
    subscription?.current_period_end ?? null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              WhyLearn Vision
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              Unlock your AI mentor
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Complete your subscription to access the full workspace.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
          >
            Back to landing
          </Link>
        </div>

        <div className="mt-8 grid gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-sm font-semibold text-slate-700">
                What&apos;s inside
              </p>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {featureList.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl mt-6 border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Your status</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {hasActiveSubscription
                ? "Active subscription"
                : "Subscription required"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {statusMessage ??
                (hasActiveSubscription
                  ? "You are all set. We will redirect you shortly."
                  : "Subscribe to continue into your workspace.")}
            </p>
            {subscription?.current_period_end ? (
              <p className="mt-2 text-xs text-slate-500">
                Renews on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={startCheckout}
              disabled={isLoading || hasActiveSubscription || isRedirecting}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRedirecting
              ? "Sending you to Stripe…"
              : hasActiveSubscription
                ? "You are subscribed"
                : "Subscribe to continue"}
            </button>
            <button
              type="button"
              onClick={fetchSubscription}
              disabled={isLoading || isRedirecting}
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh status
            </button>
          </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <p className="text-sm font-semibold text-slate-700">
                Demo stays open
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Need to explore first? The live demo remains available without a
                subscription.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link
                  href="/demo"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 transition hover:-translate-y-0.5"
                >
                  Explore demo
                </Link>
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={!subscription?.stripe_customer_id || isRedirecting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Manage billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PaywallPage() {
  return (
    <Suspense fallback={null}>
      <PaywallContent />
    </Suspense>
  );
}
