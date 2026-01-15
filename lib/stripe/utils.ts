export const isSubscriptionActive = (
  status?: string | null,
  currentPeriodEnd?: string | null
) => {
  if (!status) return false;

  const normalizedStatus = status.toLowerCase();
  const activeStatuses = new Set(["active", "trialing", "past_due"]);

  // Temporarily ignore currentPeriodEnd because stale values have been
  // ejecting valid subscribers after renewal; rely solely on Stripe status.
  if (activeStatuses.has(normalizedStatus)) return true;

  return false;
};

export const resolveAppBaseUrl = (fallback?: string) => {
  const debugEntries: string[] = [];
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    fallback,
  ].filter((value) => typeof value === "string" && value.trim().length > 0) as string[];

  console.log(candidates)
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      debugEntries.push(`resolveAppBaseUrl using: ${url.protocol}//${url.host}`);
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[resolveAppBaseUrl] candidates", {
          selected: `${url.protocol}//${url.host}`,
          env: {
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            APP_URL: process.env.APP_URL,
          },
          fallback,
        });
      }
      return `${url.protocol}//${url.host}`;
    } catch {
      debugEntries.push(`resolveAppBaseUrl invalid candidate: ${candidate}`);
      /* keep trying */
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("[resolveAppBaseUrl] falling back to localhost", {
      env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        APP_URL: process.env.APP_URL,
      },
      fallback,
      attempted: debugEntries,
    });
    return "http://localhost:3000";
  }
};
