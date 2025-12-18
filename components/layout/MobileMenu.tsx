"use client";

import { useMemo, useState } from "react";
import { DEMO_ALLOWED_VIEWS, navItems } from "@/components/layout/navConfig";
import { ViewKey } from "@/lib/types";

export const MobileMenu = ({
  currentView,
  onSelect,
  isDemo,
  comingSoonView,
  compact = false,
}: {
  currentView: ViewKey;
  onSelect: (next: ViewKey) => void;
  isDemo: boolean;
  comingSoonView: ViewKey;
  compact?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const demoAllowedSet = useMemo(
    () => new Set<ViewKey>(DEMO_ALLOWED_VIEWS),
    []
  );

  const activeNavItem = navItems.find((item) => item.key === currentView);

  return (
    <div className="lg:hidden">
      <div
        className={
          compact
            ? "flex items-center"
            : "mb-2 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        }
      >
        {compact ? null : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigate
            </p>
            <p className="text-base font-semibold text-slate-900">
              {activeNavItem?.label ?? "Choose a view"}
            </p>
          </div>
        )}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col rounded-r-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Quick navigation
                </p>
                <p className="text-xs text-slate-500">
                  Jump between any workspace view.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2 overflow-y-auto">
              {navItems.map((item) => {
                const comingSoon = item.comingSoon || item.key === comingSoonView;
                const lockedInDemo = isDemo && !demoAllowedSet.has(item.key);
                const disabled = comingSoon || lockedInDemo;
                const active = item.key === currentView;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                      disabled
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : active
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300"
                    }`}
                    onClick={() => {
                      if (disabled) return;
                      onSelect(item.key);
                      setOpen(false);
                    }}
                    disabled={disabled}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {comingSoon ? (
                      <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    ) : lockedInDemo ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Demo
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
