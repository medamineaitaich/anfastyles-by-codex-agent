import "server-only";

import { cache } from "react";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/constants";
import type {
  CartItem,
  WooCategory,
  WooCustomer,
  WooOrder,
  WooProduct,
  WooReview,
  WooVariation,
} from "@/lib/woo/types";

const baseUrl = process.env.NEXT_PUBLIC_WP_BASE_URL;
const consumerKey = process.env.WC_CONSUMER_KEY;
const consumerSecret = process.env.WC_CONSUMER_SECRET;

function assertEnv() {
  if (!baseUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      "Missing WooCommerce environment variables. Set NEXT_PUBLIC_WP_BASE_URL, WC_CONSUMER_KEY, and WC_CONSUMER_SECRET.",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    consumerKey,
    consumerSecret,
  };
}

function buildQuery(params?: Record<string, string | number | undefined | string[]>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
      continue;
    }

    query.set(key, String(value));
  }

  const output = query.toString();
  return output ? `?${output}` : "";
}

async function fetchWooResponse(
  path: string,
  init?: RequestInit,
  mode: "admin" | "store" = "store",
) {
  const env = assertEnv();
  const url =
    mode === "admin"
      ? `${env.baseUrl}/wp-json/wc/v3${path}`
      : `${env.baseUrl}/wp-json/wc/store/v1${path}`;

  const headers = new Headers(init?.headers);

  if (mode === "admin") {
    const auth = Buffer.from(`${env.consumerKey}:${env.consumerSecret}`).toString("base64");
    headers.set("Authorization", `Basic ${auth}`);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: mode === "admin" ? "no-store" : init?.cache,
    next:
      init?.method && init.method !== "GET"
        ? undefined
        : mode === "store"
          ? {
              revalidate: 180,
            }
          : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`WooCommerce request failed (${response.status}): ${detail}`);
  }

  return response;
}

async function fetchWoo<T>(
  path: string,
  init?: RequestInit,
  mode: "admin" | "store" = "store",
) {
  const response = await fetchWooResponse(path, init, mode);
  return (await response.json()) as T;
}

async function fetchWooPage<T>(
  path: string,
  init?: RequestInit,
  mode: "admin" | "store" = "store",
) {
  const response = await fetchWooResponse(path, init, mode);
  const totalPagesHeader = response.headers.get("X-WP-TotalPages");
  const totalPages = totalPagesHeader ? Number(totalPagesHeader) : null;

  return {
    items: (await response.json()) as T[],
    totalPages: Number.isFinite(totalPages) ? totalPages : null,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function matchCustomerByEmail(customers: WooCustomer[], normalizedEmail: string) {
  return customers.find((customer) => normalizeEmail(customer.email) === normalizedEmail) ?? null;
}

async function searchCustomersByTerm(term: string, normalizedEmail: string) {
  let page = 1;

  while (true) {
    const searchLookup = await fetchWooPage<WooCustomer>(
      `/customers${buildQuery({
        search: term,
        per_page: 100,
        page,
        orderby: "id",
        order: "desc",
      })}`,
      undefined,
      "admin",
    );

    const match = matchCustomerByEmail(searchLookup.items, normalizedEmail);
    if (match) {
      return match;
    }

    const reachedLastPage =
      searchLookup.totalPages !== null
        ? page >= searchLookup.totalPages
        : searchLookup.items.length < 100;

    if (!searchLookup.items.length || reachedLastPage) {
      return null;
    }

    page += 1;
  }
}

function getCustomerSearchTerms(normalizedEmail: string) {
  const localPart = normalizedEmail.split("@")[0] ?? "";
  const localPartTokens = localPart.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);

  return [...new Set([normalizedEmail, localPart, ...localPartTokens])];
}

export const getCategories = cache(async () => {
  return fetchWoo<WooCategory[]>("/products/categories", undefined, "store");
});

export async function getProducts(input?: {
  search?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}) {
  const { search, category, sort, minPrice, maxPrice, minRating } = input ?? {};

  const sortMap: Record<string, { orderby?: string; order?: string }> = {
    newest: { orderby: "date", order: "desc" },
    oldest: { orderby: "date", order: "asc" },
    price_asc: { orderby: "price", order: "asc" },
    price_desc: { orderby: "price", order: "desc" },
    rating: { orderby: "rating", order: "desc" },
    title: { orderby: "title", order: "asc" },
  };

  const products = await fetchWoo<WooProduct[]>(
    `/products${buildQuery({
      per_page: 100,
      status: "publish",
      search,
      category,
      min_price: minPrice ? String(minPrice) : undefined,
      max_price: maxPrice ? String(maxPrice) : undefined,
      ...sortMap[sort ?? "newest"],
    })}`,
    undefined,
    "admin",
  );

  return products.filter((product) => {
    const rating = Number(product.average_rating || 0);
    return minRating ? rating >= minRating : true;
  });
}

export const getLatestProducts = cache(async () => {
  const products = await getProducts({ sort: "newest" });
  return products.slice(0, 8);
});

export const getFeaturedProducts = cache(async () => {
  const products = await fetchWoo<WooProduct[]>(
    `/products${buildQuery({
      per_page: 8,
      status: "publish",
      featured: "true",
    })}`,
    undefined,
    "admin",
  );

  return products.length ? products : getLatestProducts();
});

export const getProductBySlug = cache(async (slug: string) => {
  const products = await fetchWoo<WooProduct[]>(
    `/products${buildQuery({ slug, status: "publish" })}`,
    undefined,
    "admin",
  );

  return products[0] ?? null;
});

export async function getProductsByIds(ids: number[]) {
  if (!ids.length) {
    return [];
  }

  return fetchWoo<WooProduct[]>(
    `/products${buildQuery({
      include: ids.map(String),
      per_page: ids.length,
      orderby: "include",
      status: "publish",
    })}`,
    undefined,
    "admin",
  );
}

export async function getVariations(productId: number) {
  return fetchWoo<WooVariation[]>(
    `/products/${productId}/variations${buildQuery({ per_page: 100 })}`,
    undefined,
    "admin",
  );
}

export async function getProductReviews(productId: number) {
  return fetchWoo<WooReview[]>(
    `/products/reviews${buildQuery({
      product: productId,
      per_page: 100,
      status: "approved",
    })}`,
    undefined,
    "admin",
  );
}

export async function createReview(input: {
  productId: number;
  reviewer: string;
  reviewerEmail: string;
  review: string;
  rating: number;
}) {
  return fetchWoo<WooReview>(
    "/products/reviews",
    {
      method: "POST",
      body: JSON.stringify({
        product_id: input.productId,
        reviewer: input.reviewer,
        reviewer_email: input.reviewerEmail,
        review: input.review,
        rating: input.rating,
      }),
    },
    "admin",
  );
}

export async function createCustomer(input: {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}) {
  return fetchWoo<WooCustomer>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        username: input.username,
        password: input.password,
        billing: {
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
        },
      }),
    },
    "admin",
  );
}

export async function findCustomerByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  try {
    const directLookup = await fetchWooPage<WooCustomer>(
      `/customers${buildQuery({
        email: normalizedEmail,
        per_page: 100,
      })}`,
      undefined,
      "admin",
    );

    const directMatch = matchCustomerByEmail(directLookup.items, normalizedEmail);

    if (directMatch) {
      return directMatch;
    }
  } catch {
    // Some Woo backends do not support `email=` consistently; fall back to pagination below.
  }

  for (const term of getCustomerSearchTerms(normalizedEmail)) {
    if (!term) {
      continue;
    }

    try {
      const searchMatch = await searchCustomersByTerm(term, normalizedEmail);

      if (searchMatch) {
        return searchMatch;
      }
    } catch {
      // Some Woo backends also vary on `search=`; keep the full pagination fallback below.
    }
  }

  let page = 1;
  while (true) {
    const customers = await fetchWooPage<WooCustomer>(
      `/customers${buildQuery({
        per_page: 100,
        page,
        orderby: "id",
        order: "desc",
      })}`,
      undefined,
      "admin",
    );

    const match = matchCustomerByEmail(customers.items, normalizedEmail);

    if (match) {
      return match;
    }

    const reachedLastPage =
      customers.totalPages !== null
        ? page >= customers.totalPages
        : customers.items.length < 100;

    if (!customers.items.length || reachedLastPage) {
      return null;
    }

    page += 1;
  }
}

export async function getCustomer(customerId: number) {
  return fetchWoo<WooCustomer>(`/customers/${customerId}`, undefined, "admin");
}

export async function updateCustomer(
  customerId: number,
  payload: Partial<WooCustomer> & { password?: string },
) {
  return fetchWoo<WooCustomer>(
    `/customers/${customerId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "admin",
  );
}

export async function getOrdersForCustomer(customerId: number, email?: string) {
  const byCustomer = await fetchWoo<WooOrder[]>(
    `/orders${buildQuery({
      customer: customerId,
      per_page: 100,
      orderby: "date",
      order: "desc",
    })}`,
    undefined,
    "admin",
  );

  if (byCustomer.length || !email) {
    return byCustomer;
  }

  const recent = await fetchWoo<WooOrder[]>(
    `/orders${buildQuery({
      per_page: 100,
      orderby: "date",
      order: "desc",
    })}`,
    undefined,
    "admin",
  );

  return recent.filter((order) => order.billing.email?.toLowerCase() === email.toLowerCase());
}

export async function getOrderById(orderId: number) {
  return fetchWoo<WooOrder>(`/orders/${orderId}`, undefined, "admin");
}

export async function verifyWordPressLogin(username: string, password: string) {
  const env = assertEnv();
  const response = await fetch(`${env.baseUrl}/wp-login.php`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: "wordpress_test_cookie=WP%20Cookie%20check",
    },
    body: new URLSearchParams({
      log: username,
      pwd: password,
      "wp-submit": "Log In",
      redirect_to: `${env.baseUrl}/my-account/`,
      testcookie: "1",
    }),
  });

  const body = await response.text();
  return (
    !body.includes("login_error") &&
    (body.includes("My account") ||
      body.includes("woocommerce-MyAccount-navigation") ||
      body.includes("woocommerce-account"))
  );
}

export async function createOrder(input: {
  customerId?: number;
  billing: WooCustomer["billing"];
  shipping: WooCustomer["shipping"];
  customerNote?: string;
  items: CartItem[];
  paymentMethod: "cod" | "manual";
}) {
  const lineItems = await Promise.all(
    input.items.map(async (item) => {
      const product = await fetchWoo<WooProduct>(`/products/${item.productId}`, undefined, "admin");

      let price = product.price;
      if (item.variationId) {
        const variation = await fetchWoo<WooVariation>(
          `/products/${item.productId}/variations/${item.variationId}`,
          undefined,
          "admin",
        );
        price = variation.price;
      }

      return {
        product_id: item.productId,
        variation_id: item.variationId,
        quantity: item.quantity,
        total: (Number(price) * item.quantity).toFixed(2),
        meta_data: Object.entries(item.selectedAttributes ?? {}).map(([key, value]) => ({
          key,
          value,
        })),
      };
    }),
  );

  const subtotalCents = lineItems.reduce((total, item) => total + Math.round(Number(item.total) * 100), 0);
  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;

  return fetchWoo<WooOrder>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({
        payment_method: "cod",
        payment_method_title:
          input.paymentMethod === "cod" ? "Cash on delivery" : "Manual review",
        set_paid: false,
        customer_id: input.customerId ?? 0,
        customer_note: input.customerNote,
        status: "pending",
        billing: input.billing,
        shipping: input.shipping,
        line_items: lineItems,
        shipping_lines:
          shippingCents > 0
            ? [
                {
                  method_id: "flat_rate",
                  method_title: "Flat Rate Shipping",
                  total: (shippingCents / 100).toFixed(2),
                },
              ]
            : [],
        meta_data: [
          { key: "anfastyles_headless", value: "true" },
          { key: "anfastyles_checkout_channel", value: "nextjs-storefront" },
        ],
      }),
    },
    "admin",
  );
}
