"use client";

import { useState } from "react";
import { ViewKey } from "@/lib/types";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useAppState } from "@/components/AppStateProvider";
import { useRouter } from "next/navigation";
import { DEMO_ALLOWED_VIEWS, navItems } from "@/components/layout/navConfig";

export const Sidebar = ({
  current,
  onSelect,
}: {
  current: ViewKey;
  onSelect: (next: ViewKey) => void;
}) => {
  const { session, supabase } = useSupabase();
  const { mode } = useAppState();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.replace("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const isDemo = mode === "demo";

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
      <div className="px-2">
        <p className="text-lg font-semibold text-slate-900">WhyLearn Vision</p>
        <p className="text-sm text-slate-500">
          {session ? "Your workspace" : "Vision demo"}
        </p>
      </div>
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const active = item.key === current;
          const comingSoon = Boolean(item.comingSoon);
          const disabled =
            comingSoon || (isDemo && !DEMO_ALLOWED_VIEWS.includes(item.key));
          return (
            <button
              key={item.key}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                disabled
                  ? "cursor-not-allowed border border-dashed border-slate-200 bg-slate-100 text-slate-400 opacity-70"
                  : active
                    ? "bg-slate-900 text-white hover:bg-slate-900/80"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => {
                if (disabled) return;
                onSelect(item.key);
              }}
              type="button"
              disabled={disabled}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex flex-col">
                <span className={disabled ? "font-semibold" : undefined}>
                  {item.label}
                </span>
                {comingSoon ? (
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Coming soon
                  </span>
                ) : disabled ? (
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span className="text-[10px]">🔒</span>
                    Locked in demo
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </nav>
      {session ? (
        <button
          type="button"
          className="mt-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-red-200 hover:text-red-600 disabled:opacity-70"
          onClick={signOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      ) : (
        <div className="mt-auto rounded-2xl bg-slate-900/5 p-4 text-sm text-slate-600">
          You’re building momentum. Keep checking in daily.
        </div>
      )}
    </aside>
  );
};
