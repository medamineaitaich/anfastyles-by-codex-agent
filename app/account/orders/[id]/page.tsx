import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrderById } from "@/lib/woo/client";
import { formatDate, formatWooPrice } from "@/lib/utils";

type OrderDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailProps) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const { id } = await params;
  const order = await getOrderById(Number(id));

  if (!order || (order.customer_id !== session.customerId && order.billing.email !== session.email)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <article className="card-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">
          Order #{order.number}
        </p>
        <h1 className="display-font mt-3 text-4xl font-semibold text-ink">
          {order.status.replace(/-/g, " ")}
        </h1>
        <p className="mt-3 text-sm text-muted">{formatDate(order.date_created)}</p>
      </article>
      <article className="card-surface p-6">
        <h2 className="display-font text-3xl font-semibold text-ink">Items</h2>
        <div className="mt-5 space-y-4">
          {order.line_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
              <div>
                <p className="font-semibold text-ink">
                  {item.name} x {item.quantity}
                </p>
                {item.meta_data?.length ? (
                  <p className="mt-1 text-sm text-muted">
                    {item.meta_data.map((entry) => `${entry.key}: ${entry.value}`).join(" • ")}
                  </p>
                ) : null}
              </div>
              <p className="font-semibold text-ink">{formatWooPrice(item.total)}</p>
            </div>
          ))}
        </div>
      </article>
      <article className="card-surface p-6">
        <h2 className="display-font text-3xl font-semibold text-ink">Summary</h2>
        <div className="mt-5 space-y-3 text-sm text-muted">
          <div className="flex items-center justify-between">
            <span>Payment method</span>
            <span>{order.payment_method_title}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="font-semibold text-ink">{formatWooPrice(order.total)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
