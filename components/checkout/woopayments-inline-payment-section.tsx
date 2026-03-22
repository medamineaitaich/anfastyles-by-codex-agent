"use client";

import { useEffect, useState } from "react";
import {
  CHECKOUT_PAYMENT_DATA_CONTRACT,
  INITIAL_WOOPAYMENTS_CONFIG_STATE,
  WOOPAYMENTS_BACKEND_REQUIREMENTS,
  type CheckoutBillingDetails,
  type CheckoutPaymentCollector,
  type CheckoutPaymentState,
  type WooPaymentsConfigFetchState,
  type WooPaymentsConfigResponse,
} from "@/lib/checkout/payment";
import { WooPaymentsPaymentElement } from "@/components/checkout/woopayments-payment-element";

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
        error: "Cart token is missing, so WooPayments config cannot be requested yet.",
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
      message: "Loading WooPayments client config from the backend.",
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

    console.info("[checkout-page] woopayments config fetch result", {
      status: configState.status,
      isReady: configState.data?.isReady ?? false,
      missingFields: configState.data?.missingFields ?? [],
      source: configState.data?.source ?? null,
    });
  }, [configState, isActive]);

  const config = configState.data?.config ?? null;
  const configSnapshot = configState.data?.configSnapshot ?? null;
  const missingRequirements =
    configState.data?.missingRequirements.length
      ? configState.data.missingRequirements
      : WOOPAYMENTS_BACKEND_REQUIREMENTS.filter(
          (requirement) => requirement.id !== "server_validation_contract",
        );
  const canMountSdk = Boolean(configState.data?.isReady && config);

  useEffect(() => {
    if (!isActive) {
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
    return (
      <div className="mt-6 rounded-[1.4rem] border border-border bg-white/70 p-4">
        <p className="text-sm font-semibold text-ink">Inline payment container</p>
        <p className="mt-2 text-sm leading-7 text-muted">
          Select WooPayments to mount the real secure card fields inside this section.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 rounded-[1.6rem] border border-forest/20 bg-white/80 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/70">
          WooPayments Inline
        </p>
        <h3 className="mt-2 text-xl font-semibold text-ink">
          Secure card fields will mount here
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          This is a real integration container, not a fake card form. The next step is wiring the
          official WooPayments payment element so it can create a Stripe PaymentMethod and turn it
          into `payment_data` for Store API checkout.
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
          ? "Loading WooPayments client config from the backend."
          : configState.status === "error"
            ? configState.error
            : configState.data?.message ??
              "WooPayments config is waiting for the remaining backend fields."}
      </div>

      <div className="rounded-[1.4rem] border border-dashed border-forest/40 bg-cream px-5 py-6">
        <p className="text-sm font-semibold text-ink">Card element mount point</p>
        <p className="mt-2 text-sm leading-7 text-muted">
          {canMountSdk
            ? "The official WooPayments SDK can mount secure card fields, validation, and confirmation UI inside this container."
            : "The official WooPayments SDK will mount here once the backend provides the remaining WooPayments mount config fields."}
        </p>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.3rem] bg-sand px-4 py-4">
          <p className="text-sm font-semibold text-ink">Current state</p>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              Selected method: <span className="font-medium text-ink">WooPayments</span>
            </p>
            <p>
              Payment data status:{" "}
              <span className="font-medium text-ink">{paymentState.status}</span>
            </p>
            <p>
              Config fetch state:{" "}
              <span className="font-medium text-ink">{configState.status}</span>
            </p>
            <p>
              Mount ready:{" "}
              <span className="font-medium text-ink">{canMountSdk ? "yes" : "not yet"}</span>
            </p>
            <p>{paymentState.message ?? "Waiting for WooPayments fields to provide payment data."}</p>
          </div>
        </div>

        <div className="rounded-[1.3rem] bg-sand px-4 py-4">
          <p className="text-sm font-semibold text-ink">`payment_data` contract</p>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>{CHECKOUT_PAYMENT_DATA_CONTRACT.shape}</p>
            <p>{CHECKOUT_PAYMENT_DATA_CONTRACT.serialization}</p>
            <p>
              Captured entries:{" "}
              <span className="font-medium text-ink">{paymentState.paymentData.length}</span>
            </p>
            <p>
              Next adapter:{" "}
              <span className="font-medium text-ink">
                Stripe PaymentMethod result -&gt; WooPayments `payment_data`
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-border bg-white px-4 py-4">
        <p className="text-sm font-semibold text-ink">Backend data still needed</p>
        {missingRequirements.length ? (
          <div className="mt-3 grid gap-3">
            {missingRequirements.map((requirement) => (
              <div key={requirement.id} className="rounded-[1rem] bg-sand px-3 py-3 text-sm">
                <p className="font-semibold text-ink">{requirement.label}</p>
                <p className="mt-1 leading-7 text-muted">{requirement.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted">
            All current WooPayments mount requirements are available from the backend.
          </p>
        )}
      </div>

      <div className="rounded-[1.4rem] border border-border bg-white px-4 py-4">
        <p className="text-sm font-semibold text-ink">Client config status</p>
        {configSnapshot ? (
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              Source: <span className="font-medium text-ink">{configState.data?.source}</span>
            </p>
            <p>
              Publishable key:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.publishableKey ? "available" : "missing"}
              </span>
            </p>
            <p>
              Account ID:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.accountId ?? "missing"}
              </span>
            </p>
            <p>
              Currency:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.currency ?? "missing"}
              </span>
            </p>
            <p>
              Locale: <span className="font-medium text-ink">{configSnapshot.locale}</span>
            </p>
            <p>
              Cart total:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.cartTotal ?? "missing"}
              </span>
            </p>
            <p>
              Payment methods config:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.paymentMethodsConfig ? "available" : "missing"}
              </span>
            </p>
            <p>
              Detected payment method types:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.detectedPaymentMethodTypes.join(", ") || "none"}
              </span>
            </p>
            <p>
              Force network saved cards:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.forceNetworkSavedCards === null
                  ? "missing"
                  : configSnapshot.forceNetworkSavedCards
                    ? "yes"
                    : "no"}
              </span>
            </p>
            <p>
              Styles cache version:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.stylesCacheVersion ?? "missing"}
              </span>
            </p>
            <p>
              Saved cards enabled:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.isSavedCardsEnabled === null
                  ? "missing"
                  : configSnapshot.isSavedCardsEnabled
                    ? "yes"
                    : "no"}
              </span>
            </p>
            <p>
              Enabled billing fields:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.enabledBillingFields
                  ? Object.keys(configSnapshot.enabledBillingFields).join(", ")
                  : "missing"}
              </span>
            </p>
            <p>
              Generic error message:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.genericErrorMessage ? "available" : "missing"}
              </span>
            </p>
            <p>
              Test mode:{" "}
              <span className="font-medium text-ink">
                {configSnapshot.testMode ? "yes" : "no"}
              </span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted">
            No WooPayments client config is being provided yet from the backend.
          </p>
        )}
      </div>
    </div>
  );
}
