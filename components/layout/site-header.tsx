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
        href: session ? null : "/login",
        label: session ? "Logout" : "Login",
        isAuthenticated: Boolean(session),
      }}
    />
  );
}
