import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Almost there
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Confirm your email
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          We just sent you a verification link. Open your inbox and confirm your
          email to unlock your Vision workspace. The email may take a few minutes to send. 
          Check Your Spam Folder if you don't see it shortly.
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/auth/sign-in"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Back to sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Didn’t receive it? It can take a minute. Check spam or request another
          link from the sign-in page.
        </p>
      </div>
    </div>
  );
}
