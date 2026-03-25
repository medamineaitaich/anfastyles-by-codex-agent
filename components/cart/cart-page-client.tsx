"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatPriceFromCents } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

export function CartPageClient() {
  const {
    items,
    isReady,
    updateQuantity,
    removeItem,
    subtotalCents,
    shippingCents,
    totalCents,
    freeShippingRemainingCents,
  } = useCart();

  if (!isReady) {
    return (
      <section className="content-shell py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Cart</p>
          <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Your Cart
          </h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="card-surface animate-pulse p-6">
            <div className="space-y-4">
              <div className="h-28 rounded-[1.5rem] bg-[#ece5d9]" />
              <div className="h-28 rounded-[1.5rem] bg-[#ece5d9]" />
            </div>
          </div>
          <aside className="card-surface animate-pulse h-fit p-6">
            <div className="h-10 rounded-xl bg-[#ece5d9]" />
            <div className="mt-6 space-y-4">
              <div className="h-5 rounded bg-[#ece5d9]" />
              <div className="h-5 rounded bg-[#ece5d9]" />
              <div className="h-12 rounded-full bg-[#dfe8d9]" />
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="content-shell py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Cart</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Your Cart
        </h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="card-surface p-6">
          {items.length ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="grid gap-4 rounded-[1.5rem] border border-border p-4 md:grid-cols-[auto_1fr_auto]"
                >
                  <div className="relative h-28 w-28 overflow-hidden rounded-[1.2rem] bg-sand-strong">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="space-y-3">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="display-font text-2xl font-semibold text-ink"
                    >
                      {item.name}
                    </Link>
                    {item.selectedAttributes ? (
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        {Object.values(item.selectedAttributes).join(" • ")}
                      </p>
                    ) : null}
                    <p className="font-semibold text-forest">
                      {formatPriceFromCents(item.priceCents)}
                    </p>
                    <div className="inline-flex items-center rounded-full border border-border bg-white">
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between gap-4 md:items-end">
                    <p className="text-lg font-semibold text-ink">
                      {formatPriceFromCents(item.priceCents * item.quantity)}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#b55245]"
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <h2 className="display-font text-3xl font-semibold text-ink">Your cart is empty</h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Browse the collection and add a few rooted essentials to continue.
              </p>
              <ButtonLink href="/shop" className="mt-6">
                Explore the shop
              </ButtonLink>
            </div>
          )}
        </div>

        <aside className="card-surface h-fit p-6">
          <h2 className="display-font text-3xl font-semibold text-ink">Order Summary</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatPriceFromCents(subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Shipping</span>
              <span>{shippingCents ? formatPriceFromCents(shippingCents) : "Free"}</span>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between text-lg font-semibold text-ink">
                <span>Total</span>
                <span>{formatPriceFromCents(totalCents)}</span>
              </div>
            </div>
            <div className="rounded-[1.4rem] bg-sand px-4 py-3 text-center text-sm text-muted">
              {freeShippingRemainingCents > 0
                ? `${formatPriceFromCents(freeShippingRemainingCents)} more to get free shipping.`
                : "Free shipping is active for this order."}
            </div>
            <ButtonLink href="/checkout" className="mt-2 w-full">
              Proceed to Checkout
            </ButtonLink>
          </div>
        </aside>
      </div>
    </section>
  );
}
