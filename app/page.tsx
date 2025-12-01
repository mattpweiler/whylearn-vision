import Link from "next/link";

const actions = [
  {
    label: "Explore demo",
    href: "/demo",
    style:
      "rounded-full border border-slate-900/10 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5",
  },
  {
    label: "Sign in",
    href: "/auth/sign-in",
    style:
      "rounded-full border border-transparent bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900/90",
  },
  {
    label: "Sign up",
    href: "/auth/sign-up",
    style:
      "rounded-full border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200",
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-white to-slate-50">
      <div className="absolute inset-x-0 top-0 -z-10 h-[400px] bg-gradient-to-b from-slate-100 via-white to-transparent" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <p className="text-base font-semibold tracking-tight text-slate-900">
          WhyLearn Vision
        </p>
        <div className="hidden items-center gap-4 text-sm font-medium text-slate-500 md:flex">
          <Link href="/auth/sign-in">Sign in</Link>
          <Link
            href="/auth/sign-up"
            className="rounded-full bg-slate-900 px-4 py-2 text-white"
          >
            Start free
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Personal operating system
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Bring your goals, habits, reflections, and AI mentor into one
          accountable space.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
          Build clarity around life areas, stay close to the work that matters,
          and review your traction weekly. Explore the live demo or sign in to
          sync your personal workspace powered by Supabase.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {actions.map((action) => (
            <Link key={action.label} href={action.href} className={action.style}>
              {action.label}
            </Link>
          ))}
        </div>
      </main>
      <footer className="mx-auto w-full max-w-4xl px-6 py-10 text-center text-sm text-slate-500">
        Built with Next.js, Tailwind, and Supabase Auth.
      </footer>
    </div>
  );
}
