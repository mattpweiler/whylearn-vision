import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/app"];
const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up"];

const isPathMatch = (pathname: string, paths: string[]) =>
  paths.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );

const createMiddlewareClient = (request: NextRequest, response: NextResponse) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = isPathMatch(pathname, PROTECTED_PATHS);
  const isAuthPage = isPathMatch(pathname, AUTH_PATHS);

  if (!requiresAuth && !isAuthPage) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && requiresAuth) {
    const redirectUrl = new URL("/auth/sign-in", request.url);
    redirectUrl.searchParams.set(
      "redirectTo",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/app", request.url), { status: 302 });
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/auth/:path*"],
};
