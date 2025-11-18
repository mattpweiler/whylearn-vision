"use client";

import { ViewKey } from "@/lib/types";

const navItems: { key: ViewKey; label: string; icon: string }[] = [
  { key: "today", label: "Today", icon: "☀️" },
  { key: "week", label: "This Week", icon: "📅" },
  { key: "month", label: "This Month", icon: "🗓️" },
  { key: "year", label: "Year Goals", icon: "🏔️" },
  { key: "direction", label: "Direction", icon: "🧭" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

export const Sidebar = ({
  current,
  onSelect,
}: {
  current: ViewKey;
  onSelect: (next: ViewKey) => void;
}) => {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
      <div className="px-2">
        <p className="text-lg font-semibold text-slate-900">WhyLearn Vision</p>
        <p className="text-sm text-slate-500">LifeOS demo</p>
      </div>
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const active = item.key === current;
          return (
            <button
              key={item.key}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => onSelect(item.key)}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-slate-900/5 p-4 text-sm text-slate-600">
        You’re building momentum. Keep checking in daily.
      </div>
    </aside>
  );
};
