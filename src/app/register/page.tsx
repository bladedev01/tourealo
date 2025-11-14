import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { apiFetch } from "@/lib/http";

export default async function RegisterPage() {
  // Server-side check: if the user is already authenticated, redirect to home.
  try {
    const me = await apiFetch<any>("/auth/me", { isServer: true });
    if (me) {
      redirect("/");
    }
  } catch (e) {
    // ignore - unauthenticated
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden="true"></div>
        <div className="absolute bottom-[-6rem] right-[-2rem] h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" aria-hidden="true"></div>
        <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-sky-200/30 blur-2xl" aria-hidden="true"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <RegisterForm />
      </div>
    </div>
  );
}
