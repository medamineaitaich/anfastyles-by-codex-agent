"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/constants";
import { CartDrawer } from "@/components/cart/cart-drawer";
import type { CartItem } from "@/lib/woo/types";

type CartContextValue = {
  items: CartItem[];
  isReady: boolean;
  isDrawerOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity" | "key"> & { quantity?: number }) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  totalItems: number;
  freeShippingRemainingCents: number;
};

const STORAGE_KEY = "anfastyles-cart";
const CartContext = createContext<CartContextValue | null>(null);

function buildCartKey(item: {
  productId: number;
  variationId?: number;
  selectedAttributes?: Record<string, string>;
}) {
  const options = Object.entries(item.selectedAttributes ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return [item.productId, item.variationId ?? "base", options].join("::");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(JSON.parse(raw) as CartItem[]);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = items.reduce((total, item) => total + item.priceCents * item.quantity, 0);
    const shippingCents =
      subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS || subtotalCents === 0
        ? 0
        : FLAT_SHIPPING_CENTS;

    return {
      items,
      isReady,
      isDrawerOpen,
      addItem(item) {
        const key = buildCartKey(item);
        const quantity = item.quantity ?? 1;
        setItems((current) => {
          const existing = current.find((entry) => entry.key === key);
          if (existing) {
            return current.map((entry) =>
              entry.key === key
                ? { ...entry, quantity: entry.quantity + quantity }
                : entry,
            );
          }

          return [...current, { ...item, key, quantity }];
        });
        setIsDrawerOpen(true);
      },
      updateQuantity(key, quantity) {
        if (quantity <= 0) {
          setItems((current) => current.filter((entry) => entry.key !== key));
          return;
        }

        setItems((current) =>
          current.map((entry) => (entry.key === key ? { ...entry, quantity } : entry)),
        );
      },
      removeItem(key) {
        setItems((current) => current.filter((entry) => entry.key !== key));
      },
      clearCart() {
        setItems([]);
      },
      openDrawer() {
        setIsDrawerOpen(true);
      },
      closeDrawer() {
        setIsDrawerOpen(false);
      },
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      freeShippingRemainingCents: Math.max(FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents, 0),
    };
  }, [isDrawerOpen, isReady, items]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
