"use client";

export const PageHeader = ({
  title,
  subtitle,
  profileName,
}: {
  title: string;
  subtitle: string;
  profileName: string;
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          PLAN STACK
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-right">
        <p className="text-xs text-slate-500">Logged in as</p>
        <p className="text-sm font-semibold text-slate-900">{profileName}</p>
      </div>
    </header>
  );
};
