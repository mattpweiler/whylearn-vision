import Stripe from "stripe";
import { resolveAppBaseUrl } from "@/lib/stripe/utils";

let stripeClient: Stripe | null = null;

const isProd = () => process.env.NODE_ENV === "production";

const resolveStripeSecretKey = () => {
  if (isProd()) {
    return (
      process.env.STRIPE_SECRET_KEY_LIVE ||
      process.env.STRIPE_SECRET_KEY
    );
  }
  return (
    process.env.STRIPE_SECRET_KEY_TEST ||
    process.env.STRIPE_SECRET_KEY
  );
};

const resolveStripePriceId = () => {
  if (isProd()) {
    return (
      process.env.STRIPE_PRICE_ID_LIVE ||
      process.env.STRIPE_PRICE_ID ||
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
    );
  }
  return (
    process.env.STRIPE_PRICE_ID_TEST ||
    process.env.STRIPE_PRICE_ID ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  );
};

const resolveWebhookSecret = () => {
  if (isProd()) {
    return (
      process.env.STRIPE_WEBHOOK_SECRET_LIVE ||
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }
  return (
    process.env.STRIPE_WEBHOOK_SECRET_TEST ||
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

export const getStripeClient = () => {
  if (stripeClient) return stripeClient;
  const secretKey = resolveStripeSecretKey();
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY for Stripe client.");
  }
  stripeClient = new Stripe(secretKey, {
    // Use Stripe's default pinned version; override via STRIPE_API_VERSION if needed.
    apiVersion:
      (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || undefined,
  });
  return stripeClient;
};

export const getStripePriceId = () => resolveStripePriceId();

export const getWebhookSecret = () => resolveWebhookSecret();

export const appBaseUrl = (fallback?: string) => resolveAppBaseUrl(fallback);
