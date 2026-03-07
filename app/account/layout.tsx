import Link from "next/link";
import { redirect } from "next/navigation";
import { ACCOUNT_NAV } from "@/lib/constants";
import { getSession } from "@/lib/session";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/account");
  }

  return (
    <section className="content-shell py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Account</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Hello, {session.firstName || session.username}
        </h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="card-surface h-fit p-4">
          <nav className="space-y-2">
            {ACCOUNT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[1.2rem] px-4 py-3 text-sm font-semibold text-ink hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </section>
  );
}
