import Link from "next/link";
import { getSession } from "@/lib/session";
import { getOrdersForCustomer } from "@/lib/woo/client";
import { formatDate, formatWooPrice } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const orders = await getOrdersForCustomer(session.customerId, session.email);

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="card-surface rounded-[1.7rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">
                Order #{order.number}
              </p>
              <h2 className="display-font mt-2 text-3xl font-semibold text-ink">
                {order.status.replace(/-/g, " ")}
              </h2>
              <p className="mt-2 text-sm text-muted">{formatDate(order.date_created)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-ink">{formatWooPrice(order.total)}</p>
              <Link href={`/account/orders/${order.id}`} className="mt-2 inline-block text-sm font-semibold text-forest">
                View details
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
