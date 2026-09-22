import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth-user";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xl font-semibold text-slate-950">SecondOrder</p>
        <h1 className="mt-8 text-2xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Use your company account.</p>
        <LoginForm />
      </div>
    </main>
  );
}
