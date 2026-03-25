import { LogoutButton } from "@/components/account/logout-button";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { getSession } from "@/lib/session";
import { getCustomer, getOrdersForCustomer } from "@/lib/woo/client";
import { formatWooPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const [customer, orders] = await Promise.all([
    getCustomer(session.customerId),
    getOrdersForCustomer(session.customerId, session.email),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-3">
        <article className="card-surface p-6">
          <p className="text-sm text-muted">Account email</p>
          <p className="mt-3 text-lg font-semibold text-ink">{customer.email}</p>
        </article>
        <article className="card-surface p-6">
          <p className="text-sm text-muted">Orders placed</p>
          <p className="mt-3 text-lg font-semibold text-ink">{orders.length}</p>
        </article>
        <article className="card-surface p-6">
          <p className="text-sm text-muted">Most recent total</p>
          <p className="mt-3 text-lg font-semibold text-ink">
            {orders[0] ? formatWooPrice(orders[0].total) : "$0.00"}
          </p>
        </article>
      </div>
      <ProfileForm customer={customer} />
      <PasswordForm />
      <div className="flex justify-end">
        <LogoutButton />
      </div>
    </div>
  );
}
