"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Something went wrong
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              We hit an error loading the app.
            </p>
            <p className="text-sm text-slate-600">
              It might be maintenance or a temporary outage. Check our Discord for status
              updates and fixes.
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
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
