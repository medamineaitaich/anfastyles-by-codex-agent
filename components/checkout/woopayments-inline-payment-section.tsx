"use client";

import { useEffect, useState } from "react";
import {
  INITIAL_WOOPAYMENTS_CONFIG_STATE,
  type CheckoutBillingDetails,
  type CheckoutPaymentCollector,
  type CheckoutPaymentState,
  type WooPaymentsConfigFetchState,
  type WooPaymentsConfigResponse,
} from "@/lib/checkout/payment";
import { WooPaymentsPaymentElement } from "@/components/checkout/woopayments-payment-element";
const isCheckoutDebug =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === "true";

export function WooPaymentsInlinePaymentSection({
  paymentState,
  billing,
  cartToken,
  onConfigStateChange,
  onCollectorChange,
}: {
  paymentState: CheckoutPaymentState;
  billing: CheckoutBillingDetails;
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
    <div className="mt-6 space-y-4 rounded-[1.6rem] border border-forest/20 bg-white/80 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">
          WooPayments Inline
        </p>
        <h3 className="mt-2 text-xl font-semibold text-ink">Secure card payment</h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          Enter your card details below to pay securely without leaving this page.
        </p>
      </div>

      <div
        className={`rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
          configState.status === "loading"
            ? "border border-forest/20 bg-forest/5 text-forest"
            : configState.status === "error"
              ? "border border-[#b55245]/30 bg-[#b55245]/5 text-[#7d3028]"
              : canMountSdk
                ? "border border-forest/20 bg-forest/5 text-forest"
                : "border border-amber-300/40 bg-amber-50 text-amber-900"
        }`}
      >
        {configState.status === "loading"
          ? "Loading secure payment fields."
          : configState.status === "error"
            ? "Secure payment fields are unavailable right now. Please refresh the page and try again."
            : canMountSdk
              ? "Your card details stay secure and encrypted."
              : "Secure payment fields are not ready right now. Please try again in a moment."}
      </div>

      <div className="rounded-[1.4rem] border border-dashed border-forest/40 bg-cream px-5 py-6">
        <p className="text-sm font-semibold text-ink">Card details</p>
        <div className="mt-4 min-h-24 rounded-[1rem] border border-dashed border-border bg-white/90 p-3">
          {canMountSdk && config ? (
            <WooPaymentsPaymentElement
              config={config}
              billing={billing}
              onCollectorChange={(collector) => onCollectorChange?.(collector)}
            />
          ) : (
            <div
              id="woopayments-inline-sdk-mount"
              className="min-h-24 rounded-[0.9rem] border border-dashed border-border/80 bg-white/70"
            />
          )}
        </div>
      </div>
    </div>
  );
}
