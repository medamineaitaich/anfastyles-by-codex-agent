import "server-only";

import type {
  WooStoreCart,
  WooStoreCheckout,
  WooStoreCheckoutPaymentDetail,
} from "@/lib/woo/types";

type StoreRequestOptions = {
  cartToken?: string | null;
};

type StoreResponse<T> = {
  data: T;
  cartToken: string | null;
  nonce: string | null;
};

export class WooStoreApiError extends Error {
  status: number;
  payload: unknown;
  cartToken: string | null;

  constructor(message: string, status: number, payload: unknown, cartToken: string | null) {
    super(message);
    this.name = "WooStoreApiError";
    this.status = status;
    this.payload = payload;
    this.cartToken = cartToken;
  }
}

function getStoreBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_WP_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_WP_BASE_URL environment variable.");
  }

  return baseUrl.replace(/\/$/, "");
}

function buildStoreUrl(path: string) {
  return `${getStoreBaseUrl()}/wp-json/wc/store/v1${path}`;
}

function getTokenPreview(token?: string | null) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 12)}...`;
}

async function parseStorePayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function requestStore<T>(
  path: string,
  init?: RequestInit,
  options?: StoreRequestOptions,
): Promise<StoreResponse<T>> {
  const headers = new Headers(init?.headers);

  if (options?.cartToken) {
    headers.set("Cart-Token", options.cartToken);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildStoreUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  const cartToken = response.headers.get("Cart-Token");
  const nonce = response.headers.get("Nonce");
  const payload = await parseStorePayload(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Woo Store API request failed (${response.status}).`;

    throw new WooStoreApiError(message, response.status, payload, cartToken);
  }

  return {
    data: payload as T,
    cartToken,
    nonce,
  };
}

export async function getStoreCart(cartToken?: string | null) {
  const response = await requestStore<WooStoreCart>("/cart", undefined, { cartToken });
  console.info("[woo-store/cart] fetched", {
    token: getTokenPreview(response.cartToken ?? cartToken),
    items: response.data.items_count,
    paymentMethods: response.data.payment_methods,
  });
  return response;
}

export async function addStoreCartItem(
  input: {
    productId: number;
    variationId?: number;
    quantity?: number;
  },
  cartToken?: string | null,
) {
  const response = await requestStore<WooStoreCart>(
    "/cart/add-item",
    {
      method: "POST",
      body: JSON.stringify({
        id: input.variationId ?? input.productId,
        quantity: input.quantity ?? 1,
      }),
    },
    { cartToken },
  );

  console.info("[woo-store/cart] add-item", {
    token: getTokenPreview(response.cartToken ?? cartToken),
    productId: input.productId,
    variationId: input.variationId ?? null,
    quantity: input.quantity ?? 1,
    items: response.data.items_count,
  });

  return response;
}

export async function updateStoreCartItem(
  input: {
    key: string;
    quantity: number;
  },
  cartToken?: string | null,
) {
  const response = await requestStore<WooStoreCart>(
    "/cart/update-item",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { cartToken },
  );

  console.info("[woo-store/cart] update-item", {
    token: getTokenPreview(response.cartToken ?? cartToken),
    key: input.key,
    quantity: input.quantity,
    items: response.data.items_count,
  });

  return response;
}

export async function removeStoreCartItem(key: string, cartToken?: string | null) {
  const response = await requestStore<WooStoreCart>(
    `/cart/remove-item?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
    },
    { cartToken },
  );

  console.info("[woo-store/cart] remove-item", {
    token: getTokenPreview(response.cartToken ?? cartToken),
    key,
    items: response.data.items_count,
  });

  return response;
}

export async function clearStoreCart(cartToken?: string | null) {
  const response = await requestStore<unknown>(
    "/cart/items",
    {
      method: "DELETE",
    },
    { cartToken },
  );

  const clearedCart =
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data) &&
    "items_count" in response.data
      ? (response as StoreResponse<WooStoreCart>)
      : await getStoreCart(response.cartToken ?? cartToken);

  console.info("[woo-store/cart] clear", {
    token: getTokenPreview(clearedCart.cartToken ?? cartToken),
    items: clearedCart.data.items_count,
  });

  return clearedCart;
}

export async function getStoreCheckoutDraft(cartToken?: string | null) {
  const response = await requestStore<WooStoreCheckout>(
    "/checkout",
    {
      method: "GET",
    },
    { cartToken },
  );

  console.info("[woo-store/checkout] draft", {
    token: getTokenPreview(response.cartToken ?? cartToken),
    orderId: response.data.order_id,
    status: response.data.status,
    paymentMethod: response.data.payment_method,
  });

  return response;
}

export async function submitStoreCheckout(
  input: {
    billingAddress: WooStoreCheckout["billing_address"];
    shippingAddress: WooStoreCheckout["shipping_address"];
    customerNote?: string;
    paymentMethod: string;
    paymentData?: WooStoreCheckoutPaymentDetail[];
  },
  cartToken?: string | null,
) {
  const response = await requestStore<WooStoreCheckout>(
    "/checkout",
    {
      method: "POST",
      body: JSON.stringify({
        billing_address: input.billingAddress,
        shipping_address: input.shippingAddress,
        customer_note: input.customerNote ?? "",
        payment_method: input.paymentMethod,
        payment_data: input.paymentData ?? [],
      }),
    },
    { cartToken },
  );

  console.info("[woo-store/checkout] submit", {
    token: getTokenPreview(response.cartToken ?? cartToken),
    orderId: response.data.order_id,
    status: response.data.status,
    paymentStatus: response.data.payment_result.payment_status,
    redirectUrl: response.data.payment_result.redirect_url || null,
  });

  return response;
}
