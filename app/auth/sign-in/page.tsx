import { AuthForm } from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <AuthForm mode="signIn" />
    </div>
  );
}
