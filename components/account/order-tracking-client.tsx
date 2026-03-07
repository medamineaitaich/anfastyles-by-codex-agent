"use client";

import { useMemo, useState } from "react";
import type { WooOrder } from "@/lib/woo/types";
import { Input } from "@/components/ui/input";
import { formatDate, formatWooPrice } from "@/lib/utils";

export function OrderTrackingClient({ orders }: { orders: WooOrder[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      orders.filter((order) =>
        order.number.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [orders, query],
  );

  return (
    <div className="space-y-5">
      <label className="grid gap-2 text-sm font-semibold text-ink">
        Track by order number
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter your order number"
        />
      </label>
      <div className="space-y-4">
        {filtered.map((order) => (
          <article key={order.id} className="card-surface rounded-[1.6rem] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-forest/70">
                  Order #{order.number}
                </p>
                <h3 className="display-font mt-2 text-2xl font-semibold text-ink">
                  {order.status.replace(/-/g, " ")}
                </h3>
              </div>
              <div className="text-right text-sm text-muted">
                <p>{formatDate(order.date_created)}</p>
                <p className="mt-1 font-semibold text-ink">{formatWooPrice(order.total)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
