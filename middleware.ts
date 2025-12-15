import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSubscriptionActive } from "@/lib/stripe/utils";

const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up"];
const SESSION_REQUIRED_PATHS = ["/app", "/paywall"];
const SUBSCRIPTION_REQUIRED_PATHS = ["/app"];

const isPathMatch = (pathname: string, paths: string[]) =>
  paths.some((base) => pathname === base || pathname.startsWith(`${base}/`));

const createMiddlewareClient = (request: NextRequest, response: NextResponse) =>
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
        set(name: string, value: string, options?: any) {
          response.cookies.set({ name, value, ...(options ?? {}) });
        },
        remove(name: string, options?: any) {
          response.cookies.set({
            name,
            value: "",
            ...(options ?? {}),
            maxAge: 0,
          });
        },
      },
    }
  );

const fetchSubscriptionStatus = async (
  supabase: ReturnType<typeof createMiddlewareClient>,
  userId: string
) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Subscription lookup failed in middleware", error);
    return null;
  }
  return data ?? null;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresSession = isPathMatch(pathname, SESSION_REQUIRED_PATHS);
  const requiresSubscription = isPathMatch(pathname, SUBSCRIPTION_REQUIRED_PATHS);
  const isAuthPage = isPathMatch(pathname, AUTH_PATHS);
  const isPaywall = pathname === "/paywall" || pathname.startsWith("/paywall/");

  if (!requiresSession && !isAuthPage) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: user } = session ? await supabase.auth.getUser() : { data: null };

  if ((!session || !user?.user) && requiresSession) {
    const redirectUrl = new URL("/auth/sign-in", request.url);
    redirectUrl.searchParams.set(
      "redirectTo",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  const subscriptionStatus =
    session && user?.user && (requiresSubscription || isAuthPage || isPaywall)
      ? await fetchSubscriptionStatus(supabase, session.user.id)
      : null;

  const isActive = isSubscriptionActive(
    subscriptionStatus?.status,
    subscriptionStatus?.current_period_end ?? null
  );

  if (session && isPaywall && isActive) {
    const redirectTarget = request.nextUrl.searchParams.get("redirectTo");
    const target =
      redirectTarget && redirectTarget.startsWith("/")
        ? redirectTarget
        : "/app";
    return NextResponse.redirect(new URL(target, request.url), { status: 302 });
  }

  if (session && isAuthPage) {
    const target = isActive ? "/app" : "/paywall";
    return NextResponse.redirect(new URL(target, request.url), { status: 302 });
  }

  if (session && requiresSubscription && !isActive) {
    const redirectUrl = new URL("/paywall", request.url);
    redirectUrl.searchParams.set(
      "redirectTo",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/auth/:path*", "/paywall/:path*"],
};
