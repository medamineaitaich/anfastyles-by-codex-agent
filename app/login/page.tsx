import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/login-form";
import { getSession } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/account");
  }

  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : "/account";

  return (
    <section className="content-shell py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Account</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Welcome back
        </h1>
      </div>
      <div className="mt-12">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </section>
  );
}
