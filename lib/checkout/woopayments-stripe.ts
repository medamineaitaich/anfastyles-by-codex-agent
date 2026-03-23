import {
  loadStripe,
  type PaymentIntentResult,
  type SetupIntentResult,
  type Stripe,
  type StripeConstructorOptions,
} from "@stripe/stripe-js";
import type { WooPaymentsMountConfig } from "@/lib/checkout/payment";

export type WooPaymentsConfirmationIntent = {
  intentKind: "payment" | "setup";
  orderId: number;
  clientSecret: string;
  nonce: string;
  confirmationToken: string | null;
  redirectUrl: string;
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

export function normalizeStripeLocale(locale: string) {
  const normalized = locale.replace("_", "-").toLowerCase();
  const [language] = normalized.split("-");
  const candidate = language || "en";
  const supportedLocales = new Set<string>([
    "auto",
    "ar",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en",
    "en-AU",
    "en-CA",
    "en-GB",
    "en-NZ",
    "es",
    "es-ES",
    "es-419",
    "et",
    "fi",
    "fil",
    "fr",
    "fr-CA",
    "hr",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "lt",
    "lv",
    "ms",
    "mt",
    "nb",
    "nl",
    "pl",
    "pt",
    "pt-BR",
    "ro",
    "ru",
    "sk",
    "sl",
    "sv",
    "th",
    "tr",
    "vi",
    "zh",
    "zh-HK",
    "zh-TW",
  ]);

  return (supportedLocales.has(candidate) ? candidate : "en") as StripeConstructorOptions["locale"];
}

export function getWooPaymentsStripe(config: WooPaymentsMountConfig) {
  const cacheKey = [
    config.publishableKey,
    config.accountId,
    normalizeStripeLocale(config.locale),
  ].join("::");

  const cached = stripePromiseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const nextPromise = loadStripe(config.publishableKey, {
    stripeAccount: config.accountId,
    locale: normalizeStripeLocale(config.locale),
  });

  stripePromiseCache.set(cacheKey, nextPromise);
  return nextPromise;
}

export function parseWooPaymentsConfirmationRedirect(
  redirectUrl: string | null | undefined,
): WooPaymentsConfirmationIntent | null {
  if (!redirectUrl) {
    return null;
  }

  const match = redirectUrl.match(
    /#wcpay-confirm-(pi|si):([^:]+):([^:]+):([^:]+)(?::(.+))?$/,
  );

  if (!match) {
    return null;
  }

  const orderId = Number(match[2]);
  if (!Number.isFinite(orderId) || orderId < 1) {
    return null;
  }

  return {
    intentKind: match[1] === "si" ? "setup" : "payment",
    orderId,
    clientSecret: match[3],
    nonce: match[4],
    confirmationToken: match[5] ?? null,
    redirectUrl,
  };
}

export function getWooPaymentsIntentId(
  result: PaymentIntentResult | SetupIntentResult,
) {
  const paymentIntent = "paymentIntent" in result ? result.paymentIntent : undefined;
  const setupIntent = "setupIntent" in result ? result.setupIntent : undefined;

  return (
    paymentIntent?.id ??
    setupIntent?.id ??
    result.error?.payment_intent?.id ??
    result.error?.setup_intent?.id ??
    null
  );
}

export function getWooPaymentsConfirmationErrorMessage(
  result: PaymentIntentResult | SetupIntentResult,
  fallback: string,
) {
  const paymentIntent = "paymentIntent" in result ? result.paymentIntent : undefined;

  if (result.error?.message) {
    return result.error.message;
  }

  if (paymentIntent?.last_payment_error?.message) {
    return paymentIntent.last_payment_error.message;
  }

  if (paymentIntent?.status === "requires_action") {
    return "Your payment still requires additional verification.";
  }

  return fallback;
}

export function extractOrderKeyFromUrl(redirectUrl: string | null | undefined) {
  if (!redirectUrl) {
    return null;
  }

  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://example.com";
    return new URL(redirectUrl, base).searchParams.get("key");
  } catch {
    return null;
  }
}
