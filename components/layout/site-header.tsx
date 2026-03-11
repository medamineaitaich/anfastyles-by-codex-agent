import type { SessionPayload } from "@/lib/session";
import { HeaderClient } from "@/components/layout/header-client";

export async function SiteHeader({
  sessionPromise,
}: {
  sessionPromise: Promise<SessionPayload | null>;
}) {
  await sessionPromise;
  return <HeaderClient />;
}
