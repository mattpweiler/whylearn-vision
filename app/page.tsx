"use client";

import { useState } from "react";
import Image from "next/image";
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

const productPeeks = [
  {
    title: "Win today",
    description: "Laser-focus on today's commitments with a solid, do-now list.",
    image: "/today.png",
    alt: "Today view tasks and focus for the day",
  },
  {
    title: "Plan the week",
    description: "Drag tasks into the week and conquer your day to day life.",
    image: "/weeklyplan.png",
    alt: "Weekly planner view with tasks scheduled",
  },
  {
    title: "Know your runway",
    description: "Track cash flow and net worth in one simple place - no spreadsheets.",
    image: "/financialstatement.png",
    alt: "Financial statement view showing balances and charts",
  },
];

export default function LandingPage() {
  const [activePeek, setActivePeek] = useState<(typeof productPeeks)[number] | null>(null);

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
            Sign Up
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Personal operating system
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
        A simple life dashboard for your goals, habits & finances - all in one place.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
        Plan your days, track your progress, and manage your money - all from one clean dashboard.
          
          Explore the live demo or sign in.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {actions.map((action) => (
            <Link key={action.label} href={action.href} className={action.style}>
              {action.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 w-full max-w-3xl text-left">
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="relative h-12 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                <Image
                  src="/whylearnscreenshot.png"
                  alt="WhyLearn Vision workspace"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="space-y-2 text-slate-700">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Founder note</p>
                <p className="text-lg font-semibold text-slate-900">
                 Built for creators, freelancers, and ambitious operators who want one place to run their life.
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  Life is hard to organize, especially around finances and my day to day life. I couldn&apos;t find an all in one place to plan my days, check in on finances, and organize my life in a way that actually move the week forward. WhyLearn Vision is the tool I wanted for myself.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 w-full max-w-6xl text-left">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product peek</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">See how the workspace feels</p>
            </div>
            <Link
              href="/demo"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 lg:inline-flex"
            >
              Jump into the live demo
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productPeeks.map((peek, idx) => (
              <div
                key={peek.title}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{peek.title}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    0{idx + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePeek(peek)}
                  className="group relative block h-44 w-full overflow-hidden bg-slate-100 transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Image
                    src={peek.image}
                    alt={peek.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 280px, 100vw"
                    priority={idx === 0}
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-sm">Expand</span>
                </button>
                <p className="px-4 py-3 text-sm text-slate-600">{peek.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-4xl px-6 py-10 text-center text-sm text-slate-500">
        WhyLearnTech 2026
      </footer>

      {activePeek ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setActivePeek(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product peek</p>
                <p className="text-lg font-semibold text-slate-900">{activePeek.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePeek(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5"
              >
                Close
              </button>
            </div>
            <div className="relative h-[420px] w-full overflow-hidden bg-slate-100">
              <Image
                src={activePeek.image}
                alt={activePeek.alt}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 700px, 100vw"
                priority
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
              <p className="text-sm text-slate-700">{activePeek.description}</p>
              <Link
                href="/demo"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                onClick={() => setActivePeek(null)}
              >
                Go to demo
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
