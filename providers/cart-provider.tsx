"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/constants";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { decodeHtmlEntities, getSlugFromPermalink } from "@/lib/utils";
import type { CartItem, WooStoreCart } from "@/lib/woo/types";

type CartContextValue = {
  items: CartItem[];
  isReady: boolean;
  isDrawerOpen: boolean;
  isSyncing: boolean;
  cartToken: string | null;
  paymentMethods: string[];
  addItem: (item: Omit<CartItem, "quantity" | "key"> & { quantity?: number }) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  totalItems: number;
  freeShippingRemainingCents: number;
};

type CartApiError = Error & {
  status?: number;
  details?: unknown;
};

const LEGACY_STORAGE_KEY = "anfastyles-cart";
const CART_TOKEN_STORAGE_KEY = "anfastyles-cart-token";
const CartContext = createContext<CartContextValue | null>(null);
const isCheckoutDebug =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === "true";

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

function getTokenPreview(token?: string | null) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 12)}...`;
}

function readStoredItems() {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return [];
  }
}

function mapStoreCartToItems(cart: WooStoreCart) {
  return cart.items.map((item) => ({
    key: item.key,
    productId: item.id,
    variationId: item.type === "variation" ? item.id : undefined,
    slug: getSlugFromPermalink(item.permalink),
    name: decodeHtmlEntities(item.name),
    image: item.images[0]?.src ?? "",
    priceCents: Number(item.prices.price || 0),
    quantity: item.quantity,
    type: item.type === "variation" ? "variable" : "simple",
    selectedAttributes: item.variation.length
      ? Object.fromEntries(
          item.variation.map((attribute) => [
            decodeHtmlEntities(attribute.attribute),
            decodeHtmlEntities(attribute.value),
          ]),
        )
      : undefined,
  })) satisfies CartItem[];
}

function buildCartError(status: number, payload: unknown) {
  const error = new Error(
    typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
      ? payload.message
      : "Unable to sync the WooCommerce cart.",
  ) as CartApiError;

  error.status = status;
  error.details = payload;
  return error;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeCart, setStoreCart] = useState<WooStoreCart | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartToken, setCartToken] = useState<string | null>(null);
  const cartTokenRef = useRef<string | null>(null);
  const didInitializeRef = useRef(false);

  const syncCartToken = useCallback((nextToken: string | null) => {
    cartTokenRef.current = nextToken;
    setCartToken(nextToken);

    if (nextToken) {
      window.localStorage.setItem(CART_TOKEN_STORAGE_KEY, nextToken);
      if (isCheckoutDebug) {
        console.info("[cart-provider] stored cart token", {
          token: getTokenPreview(nextToken),
        });
      }
      return;
    }

    window.localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
  }, []);

  const applyRemoteCart = useCallback((nextCart: WooStoreCart) => {
    setStoreCart(nextCart);
    setItems(mapStoreCartToItems(nextCart));
  }, []);

  const requestCart = useCallback(async (
    input: {
      method: "GET" | "POST" | "PATCH" | "DELETE";
      url: string;
      body?: string;
    },
    tokenOverride?: string | null,
  ) => {
    const headers = new Headers();
    const activeToken = tokenOverride ?? cartTokenRef.current;

    if (activeToken) {
      headers.set("Cart-Token", activeToken);
    }

    if (input.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(input.url, {
      method: input.method,
      headers,
      body: input.body,
    });

    const nextToken = response.headers.get("Cart-Token");
    if (nextToken && nextToken !== cartTokenRef.current) {
      syncCartToken(nextToken);
    }

    const payload = (await response.json()) as WooStoreCart | { message?: string; details?: unknown };

    if (!response.ok) {
      throw buildCartError(response.status, payload);
    }

    return payload as WooStoreCart;
  }, [syncCartToken]);

  const loadRemoteCart = useCallback(async (tokenOverride?: string | null) => {
    const remoteCart = await requestCart(
      {
        method: "GET",
        url: "/api/store/cart",
      },
      tokenOverride,
    );

    applyRemoteCart(remoteCart);
    return remoteCart;
  }, [applyRemoteCart, requestCart]);

  const syncLegacyItems = useCallback(async (legacyItems: CartItem[], tokenOverride?: string | null) => {
    if (!legacyItems.length) {
      return;
    }

    if (isCheckoutDebug) {
      console.info("[cart-provider] syncing legacy cart items", {
        count: legacyItems.length,
        token: getTokenPreview(tokenOverride ?? cartTokenRef.current),
      });
    }

    for (const item of legacyItems) {
      const remoteCart = await requestCart(
        {
          method: "POST",
          url: "/api/store/cart",
          body: JSON.stringify({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
          }),
        },
        tokenOverride,
      );

      applyRemoteCart(remoteCart);
      tokenOverride = cartTokenRef.current;
    }
  }, [applyRemoteCart, requestCart]);

  const refreshCart = useCallback(async () => {
    setIsSyncing(true);

    try {
      await loadRemoteCart();
    } catch (error) {
      console.error("[cart-provider] refresh failed", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [loadRemoteCart]);

  useEffect(() => {
    if (didInitializeRef.current) {
      return;
    }

    didInitializeRef.current = true;

    const legacyItems = readStoredItems();
    const storedToken = window.localStorage.getItem(CART_TOKEN_STORAGE_KEY);

    setItems(legacyItems);
    cartTokenRef.current = storedToken;
    setCartToken(storedToken);

    void (async () => {
      setIsSyncing(true);

      try {
        const remoteCart = await loadRemoteCart(storedToken);

        if (!remoteCart.items_count && legacyItems.length) {
          await syncLegacyItems(legacyItems, cartTokenRef.current);
        }
      } catch (error) {
        console.warn("[cart-provider] initial cart fetch failed, retrying with fresh token", error);
        syncCartToken(null);

        try {
          const remoteCart = await loadRemoteCart(null);
          if (!remoteCart.items_count && legacyItems.length) {
            await syncLegacyItems(legacyItems, cartTokenRef.current);
          }
        } catch (retryError) {
          console.error("[cart-provider] unable to initialize remote cart", retryError);
        }
      } finally {
        setIsSyncing(false);
        setIsReady(true);
      }
    })();
  }, [loadRemoteCart, syncCartToken, syncLegacyItems]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const subtotalCents = storeCart
    ? Number(storeCart.totals.total_items || 0)
    : items.reduce((total, item) => total + item.priceCents * item.quantity, 0);
  const shippingCents = storeCart
    ? Number(storeCart.totals.total_shipping || 0)
    : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS || subtotalCents === 0
      ? 0
      : FLAT_SHIPPING_CENTS;
  const totalCents = storeCart
    ? Number(storeCart.totals.total_price || 0)
    : subtotalCents + shippingCents;
  const totalItems = storeCart
    ? storeCart.items_count
    : items.reduce((total, item) => total + item.quantity, 0);
  const paymentMethods = useMemo(() => storeCart?.payment_methods ?? [], [storeCart]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isCheckoutDebug) {
      return;
    }

    console.info("[cart-provider] payment methods raw response", {
      paymentMethods,
      itemsCount: storeCart?.items_count ?? items.length,
      cartToken: getTokenPreview(cartToken),
    });
  }, [cartToken, isReady, items.length, paymentMethods, storeCart?.items_count]);

  const value: CartContextValue = {
    items,
    isReady,
    isDrawerOpen,
    isSyncing,
    cartToken,
    paymentMethods,
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
      setIsSyncing(true);

      void requestCart({
        method: "POST",
        url: "/api/store/cart",
        body: JSON.stringify({
          productId: item.productId,
          variationId: item.variationId,
          quantity,
        }),
      })
        .then((remoteCart) => {
          applyRemoteCart(remoteCart);
        })
        .catch(async (error) => {
          console.error("[cart-provider] addItem failed", error);
          try {
            await loadRemoteCart();
          } catch (refreshError) {
            console.error("[cart-provider] unable to recover after addItem failure", refreshError);
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    },
    updateQuantity(key, quantity) {
      const previousItems = items;

      if (quantity <= 0) {
        setItems((current) => current.filter((entry) => entry.key !== key));
      } else {
        setItems((current) =>
          current.map((entry) => (entry.key === key ? { ...entry, quantity } : entry)),
        );
      }

      setIsSyncing(true);

      void requestCart({
        method: "PATCH",
        url: "/api/store/cart",
        body: JSON.stringify({ key, quantity }),
      })
        .then((remoteCart) => {
          applyRemoteCart(remoteCart);
        })
        .catch(async (error) => {
          console.error("[cart-provider] updateQuantity failed", error);
          setItems(previousItems);
          try {
            await loadRemoteCart();
          } catch (refreshError) {
            console.error(
              "[cart-provider] unable to recover after updateQuantity failure",
              refreshError,
            );
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    },
    removeItem(key) {
      const previousItems = items;
      setItems((current) => current.filter((entry) => entry.key !== key));
      setIsSyncing(true);

      void requestCart({
        method: "DELETE",
        url: `/api/store/cart?key=${encodeURIComponent(key)}`,
      })
        .then((remoteCart) => {
          applyRemoteCart(remoteCart);
        })
        .catch(async (error) => {
          console.error("[cart-provider] removeItem failed", error);
          setItems(previousItems);
          try {
            await loadRemoteCart();
          } catch (refreshError) {
            console.error("[cart-provider] unable to recover after removeItem failure", refreshError);
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    },
    async clearCart() {
      setItems([]);
      setIsSyncing(true);

      try {
        const remoteCart = await requestCart({
          method: "DELETE",
          url: "/api/store/cart",
        });
        applyRemoteCart(remoteCart);
      } catch (error) {
        console.error("[cart-provider] clearCart failed", error);
        await loadRemoteCart();
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    refreshCart,
    openDrawer() {
      setIsDrawerOpen(true);
    },
    closeDrawer() {
      setIsDrawerOpen(false);
    },
    subtotalCents,
    shippingCents,
    totalCents,
    totalItems,
    freeShippingRemainingCents: Math.max(FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents, 0),
  };

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
