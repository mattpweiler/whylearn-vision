"use client";

import { useState } from "react";
import { AppState, ViewKey } from "@/lib/types";
import { useSupabase } from "@/components/providers/SupabaseProvider";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const viewOptions: { key: ViewKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "planner", label: "Week & Month Planner" },
  { key: "year", label: "Year Goals" },
  { key: "direction", label: "Direction" },
  { key: "financial_freedom", label: "Financial Freedom" },
  { key: "financial_profit", label: "Monthly Profit" },
  { key: "feature_vote", label: "Vote on Next Feature" },
  { key: "next_steps", label: "What are My Next Steps? (coming soon)" },
  { key: "settings", label: "Settings" },
];

export const SettingsView = ({ state, updateState }: ViewProps) => {
  const { supabase } = useSupabase();
  const [profileDraft, setProfileDraft] = useState(state.profile);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const saveProfile = () => {
    updateState((prev) => ({ ...prev, profile: profileDraft }));
  };

  const updateSettings = (changes: Partial<AppState["settings"]>) => {
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...changes },
    }));
  };

  const deleteAccount = async () => {
    if (typeof window === "undefined") return;
    const confirmDelete = window.confirm(
      "This will permanently delete your account and all synced data. Are you sure?"
    );
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Delete failed");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Unable to delete account right now. Please try again later.");
      setIsDeleting(false);
    }
  };

  const openBillingPortal = async () => {
    setBillingError(null);
    setIsBillingLoading(true);
    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to open billing portal.");
      }
      const { url } = (await response.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      console.error("Billing portal open failed", err);
      setBillingError(
        err instanceof Error
          ? err.message
          : "Unable to open billing portal right now."
      );
      setIsBillingLoading(false);
    }
  };

  const updatePassword = async () => {
    setPasswordError(null);
    setPasswordStatus(null);
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update failed", err);
      setPasswordError(
        err instanceof Error ? err.message : "Unable to update password right now."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Profile</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Display name
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={profileDraft.displayName}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Timezone
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                value={profileDraft.timezone}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, timezone: e.target.value }))
                }
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              onClick={saveProfile}
            >
              Save profile
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Preferences</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <label className="block">
              Default home view
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
                value={
                  state.settings.defaultHomeView === "next_steps"
                    ? "today"
                    : state.settings.defaultHomeView
                }
                onChange={(e) =>
                  updateSettings({
                    defaultHomeView: e.target.value as AppState["settings"]["defaultHomeView"],
                  })
                }
              >
                {viewOptions.map((option) => (
                  <option
                    key={option.key}
                    value={option.key}
                    disabled={option.key === "next_steps"}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Week starts on
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
                value={state.settings.weekStartDay}
                onChange={(e) =>
                  updateSettings({ weekStartDay: Number(e.target.value) as 0 | 1 })
                }
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </label>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-900">Privacy policy</p>
              <p className="mt-1 text-slate-600">
                Review how your data is handled any time. View the full policy&nbsp;
                <a
                  className="font-semibold text-slate-900 underline"
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                >
                  here
                </a>
                .
              </p>
              <button
                className="mt-3 w-full rounded-full border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 disabled:opacity-60"
                onClick={deleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </section>
      </div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Billing</p>
        <p className="mt-2 text-sm text-slate-600">
          Manage your subscription or cancel anytime through the Stripe billing
          portal.
        </p>
        {billingError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {billingError}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={openBillingPortal}
            disabled={isBillingLoading}
          >
            {isBillingLoading ? "Opening portal…" : "Open billing portal"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Security</p>
        <p className="mt-2 text-sm text-slate-600">
          Change your password while signed in. If you forget it, use “Forgot password?” on the sign-in page.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
            />
          </label>
        </div>
        {passwordError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {passwordError}
          </p>
        ) : null}
        {passwordStatus ? (
          <p className="mt-2 text-sm text-emerald-700" role="status">
            {passwordStatus}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/90"
            onClick={updatePassword}
          >
            Update password
          </button>
        </div>
      </section>
    </div>
  );
};
