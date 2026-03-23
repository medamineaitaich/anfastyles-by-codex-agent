"use client";

import {
  PaymentElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { type StripeElementsOptions, type StripeError } from "@stripe/stripe-js";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  INITIAL_CHECKOUT_PAYMENT_COLLECTOR,
  adaptWooPaymentsNewCardSdkResultToPaymentData,
  type CheckoutBillingDetails,
  type CheckoutPaymentCollectionResult,
  type CheckoutPaymentCollector,
  type WooPaymentsMountConfig,
} from "@/lib/checkout/payment";
import { getWooPaymentsStripe } from "@/lib/checkout/woopayments-stripe";

function buildBillingDetails(billing: CheckoutBillingDetails) {
  return {
    name: billing.full_name,
    email: billing.email,
    phone: billing.phone || undefined,
    address: {
      line1: billing.address_1,
      line2: billing.address_2 || undefined,
      city: billing.city,
      state: billing.state,
      postal_code: billing.postcode || undefined,
      country: billing.country,
    },
  };
}

function getFraudPreventionToken(config: WooPaymentsMountConfig) {
  if (typeof window !== "undefined") {
    const token = (window as Window & { wcpayFraudPreventionToken?: unknown })
      .wcpayFraudPreventionToken;

    if (typeof token === "string") {
      return token;
    }
  }

  if (
    config.fraudServices &&
    typeof config.fraudServices === "object" &&
    "sift" in config.fraudServices
  ) {
    const sift = config.fraudServices.sift;

    if (
      sift &&
      typeof sift === "object" &&
      "session_id" in sift &&
      typeof sift.session_id === "string"
    ) {
      return sift.session_id;
    }
  }

  return "";
}

function getFingerprint() {
  if (typeof window !== "undefined") {
    const fingerprint = (window as Window & { wcpayFingerprint?: unknown }).wcpayFingerprint;

    if (typeof fingerprint === "string") {
      return fingerprint;
    }
  }

  // TODO: wire the official WooPayments fingerprint hook/script once it is exposed in this headless flow.
  return "";
}

function toCollectionError(message: string): CheckoutPaymentCollectionResult {
  return {
    ok: false,
    paymentData: [],
    message,
  };
}

function getStripeErrorMessage(error: StripeError | undefined, fallback: string) {
  return error?.message ?? fallback;
}

function WooPaymentsPaymentElementInner({
  config,
  billing,
  onCollectorChange,
}: {
  config: WooPaymentsMountConfig;
  billing: CheckoutBillingDetails;
  onCollectorChange: (collector: CheckoutPaymentCollector) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [isElementComplete, setIsElementComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const collectPaymentData = useEffectEvent(async (): Promise<CheckoutPaymentCollectionResult> => {
    if (!stripe || !elements) {
      return toCollectionError("WooPayments is still loading. Please wait a moment and try again.");
    }

    const submitResult = await elements.submit();

    if (submitResult.error) {
      const message = getStripeErrorMessage(submitResult.error, config.genericErrorMessage);
      setErrorMessage(message);
      return toCollectionError(message);
    }

    const result = await stripe.createPaymentMethod({
      elements,
      params: {
        billing_details: buildBillingDetails(billing),
      },
    });

    if (result.error) {
      const message = getStripeErrorMessage(result.error, config.genericErrorMessage);
      setErrorMessage(message);
      return toCollectionError(message);
    }

    const adapted = adaptWooPaymentsNewCardSdkResultToPaymentData({
      paymentMethodId: result.paymentMethod.id,
      fraudPreventionToken: getFraudPreventionToken(config),
      fingerprint: getFingerprint(),
      savePaymentMethod,
    });

    setErrorMessage(null);

    return {
      ok: adapted.ready,
      paymentData: adapted.paymentData,
      message: adapted.ready ? null : "WooPayments could not build payment_data from the Stripe result.",
    };
  });

  useEffect(() => {
    const collector: CheckoutPaymentCollector =
      stripe && elements
        ? {
            status: isElementReady ? (errorMessage ? "error" : "ready") : "mounting",
            canSubmit: Boolean(isElementReady && isElementComplete && !errorMessage),
            message: errorMessage ?? null,
            collectPaymentData,
          }
        : {
            ...INITIAL_CHECKOUT_PAYMENT_COLLECTOR,
            status: "mounting",
            message: "Loading WooPayments secure fields.",
          };

    onCollectorChange(collector);
  }, [
    elements,
    errorMessage,
    isElementComplete,
    isElementReady,
    onCollectorChange,
    stripe,
  ]);

  return (
    <div className="space-y-4">
      <div id="woopayments-inline-sdk-mount" className="rounded-[1rem] bg-white/95 p-3">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: Object.keys(config.paymentMethodsConfig),
          }}
          onReady={() => {
            setIsElementReady(true);
          }}
          onChange={(event) => {
            setIsElementComplete(event.complete);
            setErrorMessage(null);
          }}
        />
      </div>
      {config.isSavedCardsEnabled ? (
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border text-forest"
            checked={savePaymentMethod}
            onChange={(event) => setSavePaymentMethod(event.target.checked)}
          />
          <span>Save this card for future purchases.</span>
        </label>
      ) : null}
      {errorMessage ? <p className="text-sm text-[#b55245]">{errorMessage}</p> : null}
    </div>
  );
}

export function WooPaymentsPaymentElement({
  config,
  billing,
  onCollectorChange,
}: {
  config: WooPaymentsMountConfig;
  billing: CheckoutBillingDetails;
  onCollectorChange: (collector: CheckoutPaymentCollector) => void;
}) {
  const stripePromise = useMemo(
    () => getWooPaymentsStripe(config),
    [config],
  );

  const elementsOptions = useMemo<StripeElementsOptions>(
    () => ({
      mode: config.cartTotal < 1 ? "setup" : "payment",
      amount: config.cartTotal,
      currency: config.currency.toLowerCase(),
      paymentMethodCreation: "manual",
    }),
    [config.cartTotal, config.currency],
  );

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <WooPaymentsPaymentElementInner
        config={config}
        billing={billing}
        onCollectorChange={onCollectorChange}
      />
    </Elements>
  );
}
