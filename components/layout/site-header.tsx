import type { SessionPayload } from "@/lib/session";
import { HeaderClient } from "@/components/layout/header-client";

export async function SiteHeader({
  sessionPromise,
}: {
  sessionPromise: Promise<SessionPayload | null>;
}) {
  const session = await sessionPromise;

  return (
    <HeaderClient
      account={{
        href: session ? "/account" : "/login",
        label: session ? "Account" : "Login",
        isAuthenticated: Boolean(session),
      }}
    />
  );
}
