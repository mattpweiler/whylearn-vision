"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export default function ResetPasswordPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Reset link expired. Request a new one from the sign-in page.");
      }
      setIsReady(true);
    };
    void checkSession();
  }, [supabase]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError("Reset link expired. Request a new one from the sign-in page.");
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setStatus("Password updated. You can now sign in.");
      setTimeout(() => router.replace("/auth/sign-in"), 1200);
    } catch (err) {
      console.error("Password update failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the password right now."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold text-slate-500">Reset password</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Choose a new password
        </h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              disabled={!isReady}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              disabled={!isReady}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {status ? (
            <p className="text-sm text-emerald-700" role="status">
              {status}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            If all else fails, email <a className="font-semibold text-slate-900" href="mailto:whylearnwednesdays@gmail.com">whylearnwednesdays@gmail.com</a> and we'll help.
          </p>
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/90 disabled:opacity-70"
            disabled={!isReady}
          >
            Update password
          </button>
          <button
            type="button"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            onClick={() => router.replace("/auth/sign-in")}
          >
            Back to sign in
          </button>
        </form>
      </div>
    </div>
  );
}
