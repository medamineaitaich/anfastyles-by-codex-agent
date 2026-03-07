import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/register-form";
import { getSession } from "@/lib/session";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect("/account");
  }

  return (
    <section className="content-shell py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Register</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Create your account
        </h1>
      </div>
      <div className="mt-12">
        <RegisterForm />
      </div>
    </section>
  );
}
