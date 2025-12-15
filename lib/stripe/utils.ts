export const isSubscriptionActive = (
  status?: string | null,
  currentPeriodEnd?: string | null
) => {
  if (!status) return false;
  const active = status === "active" || status === "trialing";
  if (!active) return false;
  if (!currentPeriodEnd) return true;
  const expiresAt = new Date(currentPeriodEnd).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
};

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
