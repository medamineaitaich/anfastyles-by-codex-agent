"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PAYMENT_OPTIONS } from "@/lib/constants";
import type { WooCustomer } from "@/lib/woo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPriceFromCents } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

export function CheckoutPageClient({
  customer,
  isAuthenticated,
}: {
  customer?: WooCustomer | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { items, subtotalCents, shippingCents, totalCents, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "manual">("cod");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<{ orderId: number; orderNumber: string } | null>(null);
  const [form, setForm] = useState({
    billing: {
      first_name: customer?.first_name ?? "",
      last_name: customer?.last_name ?? "",
      email: customer?.email ?? "",
      phone: customer?.billing.phone ?? "",
      address_1: customer?.billing.address_1 ?? "",
      address_2: customer?.billing.address_2 ?? "",
      city: customer?.billing.city ?? "",
      state: customer?.billing.state ?? "",
      postcode: customer?.billing.postcode ?? "",
      country: customer?.billing.country || "US",
    },
    shipping: {
      first_name: customer?.shipping.first_name || customer?.first_name || "",
      last_name: customer?.shipping.last_name || customer?.last_name || "",
      address_1: customer?.shipping.address_1 || customer?.billing.address_1 || "",
      address_2: customer?.shipping.address_2 || customer?.billing.address_2 || "",
      city: customer?.shipping.city || customer?.billing.city || "",
      state: customer?.shipping.state || customer?.billing.state || "",
      postcode: customer?.shipping.postcode || customer?.billing.postcode || "",
      country: customer?.shipping.country || customer?.billing.country || "US",
    },
    customerNote: "",
  });

  const disabled = useMemo(() => !items.length || pending, [items.length, pending]);

  async function submit() {
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items,
        paymentMethod,
      }),
    });

    const payload = (await response.json()) as {
      message?: string;
      orderId?: number;
      orderNumber?: string;
    };

    setPending(false);

    if (!response.ok || !payload.orderId || !payload.orderNumber) {
      setMessage(payload.message ?? "Unable to place the order.");
      return;
    }

    clearCart();
    setSuccess({ orderId: payload.orderId, orderNumber: payload.orderNumber });

    if (isAuthenticated) {
      router.push(`/account/orders/${payload.orderId}?placed=1`);
      router.refresh();
    }
  }

  if (success && !isAuthenticated) {
    return (
      <section className="content-shell py-16">
        <div className="card-surface mx-auto max-w-3xl p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">
            Order placed
          </p>
          <h1 className="display-font mt-4 text-5xl font-semibold text-ink">
            Thank you for your order.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Your order number is #{success.orderNumber}. Keep it for future tracking and support.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-shell py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Checkout</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Complete your order
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">
          Each item is printed after ordering. Please allow a short production window before shipment.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="card-surface p-6">
            <h2 className="display-font text-3xl font-semibold text-ink">Billing details</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                First Name
                <Input
                  value={form.billing.first_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, first_name: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Last Name
                <Input
                  value={form.billing.last_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, last_name: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Email
                <Input
                  value={form.billing.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, email: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Phone
                <Input
                  value={form.billing.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, phone: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Address
                <Input
                  value={form.billing.address_1}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, address_1: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Apartment
                <Input
                  value={form.billing.address_2}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, address_2: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                City
                <Input
                  value={form.billing.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, city: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                State
                <Input
                  value={form.billing.state}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, state: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Postcode
                <Input
                  value={form.billing.postcode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, postcode: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Country
                <Input
                  value={form.billing.country}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, country: event.target.value },
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="display-font text-3xl font-semibold text-ink">Shipping details</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["First Name", "first_name"],
                ["Last Name", "last_name"],
                ["Address", "address_1"],
                ["Apartment", "address_2"],
                ["City", "city"],
                ["State", "state"],
                ["Postcode", "postcode"],
                ["Country", "country"],
              ].map(([label, key]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-ink">
                  {label}
                  <Input
                    value={form.shipping[key as keyof typeof form.shipping]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        shipping: { ...current.shipping, [key]: event.target.value },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="display-font text-3xl font-semibold text-ink">Payment</h2>
            <div className="mt-6 space-y-3">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`block rounded-[1.4rem] border p-4 ${paymentMethod === option.id ? "border-forest bg-forest/5" : "border-border bg-white/70"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="sr-only"
                    checked={paymentMethod === option.id}
                    onChange={() => setPaymentMethod(option.id)}
                  />
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  <span className="mt-1 block text-sm leading-7 text-muted">{option.description}</span>
                </label>
              ))}
            </div>
            <label className="mt-6 grid gap-2 text-sm font-semibold text-ink">
              Order Note
              <Textarea
                value={form.customerNote}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerNote: event.target.value }))
                }
                placeholder="Delivery notes, gate code, or support details."
              />
            </label>
            {message ? <p className="mt-4 text-sm text-[#b55245]">{message}</p> : null}
          </div>
        </div>

        <aside className="card-surface h-fit p-6">
          <h2 className="display-font text-3xl font-semibold text-ink">Order summary</h2>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-ink">
                    {item.name} x {item.quantity}
                  </p>
                  {item.selectedAttributes ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {Object.values(item.selectedAttributes).join(" • ")}
                    </p>
                  ) : null}
                </div>
                <p className="font-medium text-ink">
                  {formatPriceFromCents(item.priceCents * item.quantity)}
                </p>
              </div>
            ))}
            <div className="border-t border-border pt-4 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPriceFromCents(subtotalCents)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Shipping</span>
                <span>{shippingCents ? formatPriceFromCents(shippingCents) : "Free"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatPriceFromCents(totalCents)}</span>
              </div>
            </div>
            <Button type="button" className="mt-2 w-full" disabled={disabled} onClick={submit}>
              {pending ? "Placing order..." : "Place order"}
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
