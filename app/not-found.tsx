"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Page not found
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            We couldn&apos;t find that page.
          </p>
          <p className="text-sm text-slate-600">
            If something seems broken, check our Discord for updates—it could be
            maintenance or a temporary issue.
          </p>
          <p className="text-sm font-semibold text-slate-900">
            <Link
              href="https://discord.gg/tnBeQdq3sg"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Join the Discord
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to home
          </Link>
          <Link
            href="/app"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Go to app
          </Link>
        </div>
      </div>
    </main>
  );
}
