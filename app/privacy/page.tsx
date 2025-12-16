"use client";

const lastUpdated = "December 16, 2025";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 bg-white px-4 py-10 text-black">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Last updated {lastUpdated}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500">
          This policy describes how WhyLearn handles your information when you
          use the WhyLearn OS application.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">
          What data we collect
        </h2>
        <p>
          We store only the information you intentionally enter into WhyLearn,
          such as your tasks, goals, reflections, and self-reported financial
          inputs. We do not connect to external financial institutions or ingest
          data from third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">
          How your data is used
        </h2>
        <p>
          Your entries power the features inside WhyLearn so you can plan and
          track progress. We do not sell your information or use it for
          advertising. If you sign in, your data is synced securely to your
          account so you can access it across devices.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">
          Storage & security
        </h2>
        <p>
          Application data is encrypted in transit and at rest. Only the minimal
          team members responsible for operating the service can access the
          databases, and all access is logged. We recommend using a unique,
          strong password for your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">
          Your choices & controls
        </h2>
        <p>
          You can export or delete your account data any time by contacting
          whylearnwednesdays@gmail.com. Inside the app you can also edit or remove any
          entry manually—changes sync to your account immediately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Contact us</h2>
        <p>
          If you have questions about this policy or how WhyLearn handles data,
          reach out at whylearnwednesdays@gmail.com. We&apos;re happy to help.
        </p>
      </section>
    </main>
  );
}
