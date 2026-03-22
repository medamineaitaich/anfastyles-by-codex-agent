import "server-only";

import {
  WOOPAYMENTS_BACKEND_REQUIREMENTS,
  type WooPaymentsBackendRequirement,
  type WooPaymentsConfigField,
  type WooPaymentsConfigResponse,
  type WooPaymentsMountConfig,
  type WooPaymentsMountConfigSnapshot,
} from "@/lib/checkout/payment";
import { WooStoreApiError, getStoreCart } from "@/lib/woo/store";

type ResolveWooPaymentsConfigResult = WooPaymentsConfigResponse & {
  cartToken: string | null;
  nonce: string | null;
};

function getWordPressBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_WP_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_WP_BASE_URL environment variable.");
  }

  return baseUrl.replace(/\/$/, "");
}

function buildWooPaymentsConfigUrl() {
  return `${getWordPressBaseUrl()}/wp-json/anfastyles/v1/woopayments-config`;
}

function normalizeLocale(localeHeader?: string | null) {
  const [locale] = (localeHeader ?? "").split(",");
  return locale?.trim() || "en-US";
}

function getTokenPreview(token?: string | null) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 12)}...`;
}

async function parseResponsePayload(response: Response) {
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

type WordPressWooPaymentsConfigPayload = {
  ok: boolean;
  isReady: boolean;
  missingFields?: WooPaymentsConfigField[];
  config?: Partial<WooPaymentsMountConfig> | null;
  debug?: Record<string, unknown>;
  blocksData?: Record<string, unknown>;
};

const REQUIREMENT_BY_FIELD: Partial<
  Record<WooPaymentsConfigField, WooPaymentsBackendRequirement["id"]>
> = {
  publishableKey: "publishable_key",
  accountId: "account_id",
  cartTotal: "cart_context",
  paymentMethodsConfig: "payment_methods_config",
  isSavedCardsEnabled: "saved_cards_config",
  enabledBillingFields: "billing_fields_config",
  stylesCacheVersion: "styles_cache_version",
  genericErrorMessage: "generic_error_message",
};

function assertWooPaymentsConfigPayload(payload: unknown): WordPressWooPaymentsConfigPayload {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("ok" in payload) ||
    typeof payload.ok !== "boolean" ||
    !("isReady" in payload) ||
    typeof payload.isReady !== "boolean"
  ) {
    throw new Error("WordPress WooPayments config endpoint returned an unexpected payload.");
  }

  return payload as WordPressWooPaymentsConfigPayload;
}

function buildConfigSnapshot(
  config: Partial<WooPaymentsMountConfig> | null | undefined,
  locale: string,
): WooPaymentsMountConfigSnapshot {
  return {
    publishableKey: config?.publishableKey ?? null,
    accountId: config?.accountId ?? null,
    locale: config?.locale ?? locale,
    currency: config?.currency ?? null,
    cartTotal: typeof config?.cartTotal === "number" ? config.cartTotal : null,
    paymentMethodsConfig: config?.paymentMethodsConfig ?? null,
    testMode: Boolean(config?.testMode),
    forceNetworkSavedCards:
      typeof config?.forceNetworkSavedCards === "boolean"
        ? config.forceNetworkSavedCards
        : null,
    stylesCacheVersion: config?.stylesCacheVersion ?? null,
    isSavedCardsEnabled:
      typeof config?.isSavedCardsEnabled === "boolean"
        ? config.isSavedCardsEnabled
        : null,
    enabledBillingFields: config?.enabledBillingFields ?? null,
    genericErrorMessage: config?.genericErrorMessage ?? null,
    fraudServices: config?.fraudServices ?? null,
    expressCheckout: null,
    detectedPaymentMethodTypes: Object.keys(config?.paymentMethodsConfig ?? {}),
  };
}

function buildMissingRequirements(missingFields: WooPaymentsConfigField[]) {
  const requirementIds = new Set(
    missingFields
      .map((field) => REQUIREMENT_BY_FIELD[field])
      .filter((value): value is WooPaymentsBackendRequirement["id"] => Boolean(value)),
  );

  return WOOPAYMENTS_BACKEND_REQUIREMENTS.filter((requirement) => requirementIds.has(requirement.id));
}

function buildMessage(isReady: boolean, missingFields: WooPaymentsConfigField[]) {
  if (isReady) {
    return "WooPayments mount config is ready for the official SDK mount.";
  }

  return `WooPayments mount config is incomplete. Missing: ${missingFields.join(", ")}.`;
}

export async function resolveWooPaymentsClientConfig(input?: {
  cartToken?: string | null;
  locale?: string | null;
}): Promise<ResolveWooPaymentsConfigResult> {
  const locale = normalizeLocale(input?.locale);
  let cartToken: string | null = input?.cartToken ?? null;
  let nonce: string | null = null;

  try {
    const storeCart = await getStoreCart(input?.cartToken);
    cartToken = storeCart.cartToken ?? cartToken;
    nonce = storeCart.nonce;
  } catch (error) {
    if (error instanceof WooStoreApiError) {
      console.warn("[woopayments/config] cart-context-unavailable", {
        status: error.status,
        cartToken: getTokenPreview(error.cartToken ?? input?.cartToken ?? null),
      });
    } else {
      console.warn("[woopayments/config] cart-context-unavailable", {
        message: error instanceof Error ? error.message : "Unknown cart context error.",
      });
    }
  }

  const headers = new Headers({
    Accept: "application/json",
    "Accept-Language": locale,
  });

  if (cartToken) {
    headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    headers.set("Nonce", nonce);
  }

  const response = await fetch(buildWooPaymentsConfigUrl(), {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const payload = await parseResponsePayload(response);
  const responseCartToken = response.headers.get("Cart-Token");
  const responseNonce = response.headers.get("Nonce");

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Unable to load WooPayments config from WordPress.";

    throw new Error(message);
  }

  const resolved = assertWooPaymentsConfigPayload(payload);
  const missingFields = resolved.missingFields ?? [];
  const configSnapshot = buildConfigSnapshot(resolved.config, locale);

  return {
    ok: resolved.ok,
    source: "wordpress_woopayments_endpoint",
    message: buildMessage(resolved.isReady, missingFields),
    isReady: resolved.isReady,
    productionSafe: resolved.isReady,
    fallbackUsed: false,
    config: resolved.config && resolved.isReady ? (resolved.config as WooPaymentsMountConfig) : null,
    configSnapshot,
    missingFields,
    missingRequirements: buildMissingRequirements(missingFields),
    debug: resolved.debug,
    blocksData: resolved.blocksData,
    cartToken: responseCartToken ?? cartToken,
    nonce: responseNonce ?? nonce,
  };
}
