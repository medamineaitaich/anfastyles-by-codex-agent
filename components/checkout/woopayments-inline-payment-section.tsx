"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, type RefObject, useState } from "react";
import {
  INITIAL_WOOPAYMENTS_CONFIG_STATE,
  type CheckoutBillingDetails,
  type CheckoutPaymentCollector,
  type CheckoutPaymentState,
  type WooPaymentsConfigFetchState,
  type WooPaymentsConfigResponse,
} from "@/lib/checkout/payment";
const isCheckoutDebug =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === "true";

const WooPaymentsPaymentElement = dynamic(
  () =>
    import("@/components/checkout/woopayments-payment-element").then(
      (module) => module.WooPaymentsPaymentElement,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-[1.05rem] bg-[#f1ece3]" />
        <div className="h-12 animate-pulse rounded-[1rem] bg-[#f6f2ea]" />
      </div>
    ),
  },
);

export const WooPaymentsInlinePaymentSection = memo(function WooPaymentsInlinePaymentSection({
  paymentState,
  billingRef,
  cartToken,
  onConfigStateChange,
  onCollectorChange,
}: {
  paymentState: CheckoutPaymentState;
  billingRef: RefObject<CheckoutBillingDetails>;
  cartToken: string | null;
  onConfigStateChange?: (state: WooPaymentsConfigFetchState) => void;
  onCollectorChange?: (collector: CheckoutPaymentCollector) => void;
}) {
  const isActive = paymentState.method === "woocommerce_payments";
  const [configState, setConfigState] = useState<WooPaymentsConfigFetchState>(
    INITIAL_WOOPAYMENTS_CONFIG_STATE,
  );

  useEffect(() => {
    if (!isActive) {
      setConfigState(INITIAL_WOOPAYMENTS_CONFIG_STATE);
      onConfigStateChange?.(INITIAL_WOOPAYMENTS_CONFIG_STATE);
      onCollectorChange?.({
        status: "idle",
        canSubmit: false,
        message: null,
        collectPaymentData: null,
      });
      return;
    }

    if (!cartToken) {
      const nextState: WooPaymentsConfigFetchState = {
        status: "error",
        data: null,
        error: "Your cart session expired. Please refresh the page and try again.",
      };

      setConfigState(nextState);
      onConfigStateChange?.(nextState);
      onCollectorChange?.({
        status: "error",
        canSubmit: false,
        message: nextState.error,
        collectPaymentData: null,
      });
      return;
    }

    const controller = new AbortController();
    const nextLoadingState: WooPaymentsConfigFetchState = {
      status: "loading",
      data: null,
      error: null,
    };

    setConfigState(nextLoadingState);
    onConfigStateChange?.(nextLoadingState);
    onCollectorChange?.({
      status: "mounting",
      canSubmit: false,
      message: "Loading secure payment fields.",
      collectPaymentData: null,
    });

    void (async () => {
      try {
        const response = await fetch("/api/checkout/woopayments-config", {
          method: "GET",
          headers: {
            "Cart-Token": cartToken,
          },
          signal: controller.signal,
        });

        const payload = (await response.json()) as WooPaymentsConfigResponse | { message?: string };

        if (!response.ok || !("ok" in payload) || !payload.ok) {
          throw new Error(payload.message ?? "Unable to load WooPayments config.");
        }

        const nextState: WooPaymentsConfigFetchState = {
          status: "success",
          data: payload,
          error: null,
        };

        setConfigState(nextState);
        onConfigStateChange?.(nextState);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const nextState: WooPaymentsConfigFetchState = {
          status: "error",
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load WooPayments config.",
        };

        setConfigState(nextState);
        onConfigStateChange?.(nextState);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [cartToken, isActive, onCollectorChange, onConfigStateChange]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (!isCheckoutDebug) {
      return;
    }

    console.info("[checkout-page] woopayments config fetch result", {
      status: configState.status,
      isReady: configState.data?.isReady ?? false,
      missingFields: configState.data?.missingFields ?? [],
      source: configState.data?.source ?? null,
    });
  }, [configState, isActive]);

  const config = configState.data?.config ?? null;
  const canMountSdk = Boolean(configState.data?.isReady && config);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (!isCheckoutDebug) {
      return;
    }

    console.info("[checkout-page] woopayments mount-ready state", {
      selectedMethod: paymentState.method,
      isActive,
      canMountSdk,
      configReady: configState.data?.isReady ?? false,
    });
  }, [canMountSdk, configState.data?.isReady, isActive, paymentState.method]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="mt-5 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-ink">Card details</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Enter your card details below to pay securely without leaving this page.
        </p>
      </div>

      <p
        className={`text-sm leading-6 ${
          configState.status === "loading"
            ? "text-forest"
            : configState.status === "error"
              ? "text-[#8f3a31]"
              : canMountSdk
                ? "text-forest"
                : "text-[#7f6842]"
        }`}
      >
        {configState.status === "loading"
          ? "Loading secure payment fields."
          : configState.status === "error"
            ? "Secure payment fields are unavailable right now. Please refresh the page and try again."
            : canMountSdk
              ? "Your card details stay secure and encrypted."
              : "Secure payment fields are not ready right now. Please try again in a moment."}
      </p>

      {canMountSdk && config ? (
        <WooPaymentsPaymentElement
          config={config}
          billingRef={billingRef}
          onCollectorChange={(collector) => onCollectorChange?.(collector)}
        />
      ) : (
        <div
          id="woopayments-inline-sdk-mount"
          className={`min-h-24 rounded-[1rem] ${
            configState.status === "loading"
              ? "animate-pulse bg-[#f1ece3]"
              : "border border-dashed border-[#d9d1c1] bg-[#fcfaf6]"
          }`}
        />
      )}
    </div>
  );
});
