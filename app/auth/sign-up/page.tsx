import { AuthForm } from "@/components/auth/AuthForm";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <Suspense>
          <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <AuthForm mode="signUp" />
    </div>
    </Suspense>
  );
}
