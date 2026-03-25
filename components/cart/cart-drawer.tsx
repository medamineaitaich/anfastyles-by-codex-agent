"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { formatPriceFromCents } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    subtotalCents,
    shippingCents,
    totalCents,
    freeShippingRemainingCents,
  } = useCart();

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isDrawerOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!isDrawerOpen}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity ${isDrawerOpen ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawer}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-cream shadow-2xl transition-transform ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">
              Cart
            </p>
            <h2 className="display-font text-3xl font-semibold text-ink">Your selection</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white"
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.key} className="card-surface flex gap-4 rounded-[1.6rem] p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-sand-strong">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/shop/${item.slug}`}
                          className="display-font text-xl font-semibold text-ink"
                          onClick={closeDrawer}
                        >
                          {item.name}
                        </Link>
                        {item.selectedAttributes ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                            {Object.values(item.selectedAttributes).join(" • ")}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-semibold text-forest">
                        {formatPriceFromCents(item.priceCents * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
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
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-forest">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="display-font text-3xl font-semibold text-ink">Your cart is empty</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
                Start with a small collection of thoughtfully printed essentials and we will keep
                the checkout ready.
              </p>
              <ButtonLink href="/shop" className="mt-6" onClick={closeDrawer}>
                Browse the shop
              </ButtonLink>
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-6">
          <div className="rounded-[1.75rem] border border-border bg-white/80 p-5">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatPriceFromCents(subtotalCents)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted">
              <span>Shipping</span>
              <span>{shippingCents ? formatPriceFromCents(shippingCents) : "Free"}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatPriceFromCents(totalCents)}</span>
            </div>
            <p className="mt-4 rounded-[1.4rem] bg-sand px-4 py-3 text-center text-sm text-muted">
              {freeShippingRemainingCents > 0
                ? `${formatPriceFromCents(freeShippingRemainingCents)} away from free shipping.`
                : "Free shipping unlocked for this cart."}
            </p>
            <div className="mt-5 grid gap-3">
              <ButtonLink href="/checkout" className="w-full" onClick={closeDrawer}>
                Proceed to checkout
              </ButtonLink>
              <ButtonLink href="/cart" variant="secondary" className="w-full" onClick={closeDrawer}>
                View full cart
              </ButtonLink>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
