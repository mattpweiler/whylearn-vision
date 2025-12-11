export const isSubscriptionActive = (status?: string | null) =>
  status === "active" || status === "trialing";

export const resolveAppBaseUrl = (fallback?: string) => {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    fallback,
  ].filter((value) => typeof value === "string" && value.trim().length > 0) as string[];

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      return `${url.protocol}//${url.host}`;
    } catch {
      /* keep trying */
    }
  }

  return "http://localhost:3000";
};
