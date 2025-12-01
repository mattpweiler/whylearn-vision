"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export const PageHeader = ({
  title,
  subtitle,
  profileName,
}: {
  title: string;
  subtitle: string;
  profileName: string;
}) => {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const goToSettings = () => {
    router.replace("/app?view=settings");
    setMenuOpen(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.replace("/auth/sign-in");
    router.refresh();
  };

  const showMenu = Boolean(session);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs text-slate-500 transition hover:border-slate-200 hover:cursor-pointer"
          onClick={() => {
            if (showMenu) setMenuOpen((open) => !open);
          }}
          disabled={!showMenu}
        >
          <span className="block">Logged in as</span>
          <span className="text-sm font-semibold text-slate-900">
            {profileName}
          </span>
        </button>
        {menuOpen ? (
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200 bg-white py-2 text-sm shadow-xl">
            <button
              type="button"
              className="flex w-full items-center px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
              onClick={goToSettings}
            >
              Account settings
            </button>
            <button
              type="button"
              className="flex w-full items-center px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
