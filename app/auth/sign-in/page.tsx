import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <AuthForm mode="signIn" />
      </div>
    </Suspense>
  );
}
