"use client";

import { useEffect, useMemo, useState } from "react";
import type { WooCustomer, WooStoreCheckout } from "@/lib/woo/types";
import {
  getDefaultPaymentMethod,
  INITIAL_CHECKOUT_PAYMENT_COLLECTOR,
  INITIAL_WOOPAYMENTS_CONFIG_STATE,
  type CheckoutBillingDetails,
  type CheckoutPaymentDataEntry,
  type CheckoutPaymentCollector,
  type CheckoutPaymentState,
  type WooPaymentsConfigFetchState,
  type WooPaymentsConfigResponse,
} from "@/lib/checkout/payment";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPriceFromCents } from "@/lib/utils";
import { WooPaymentsInlinePaymentSection } from "@/components/checkout/woopayments-inline-payment-section";
import {
  extractOrderKeyFromUrl,
  getWooPaymentsConfirmationErrorMessage,
  getWooPaymentsIntentId,
  getWooPaymentsStripe,
  parseWooPaymentsConfirmationRedirect,
} from "@/lib/checkout/woopayments-stripe";
import { useCart } from "@/providers/cart-provider";

type FieldErrors = Partial<Record<keyof CheckoutBillingDetails, string>>;
type CheckoutFeedback = {
  tone: "error" | "info";
  text: string;
};
type CheckoutSuccessState = {
  orderId: number;
  orderNumber: string;
  orderKey: string | null;
  redirectUrl: string | null;
  paymentStatus: string | null;
};
type SubmitPhase = "idle" | "submitting" | "confirming";
const isCheckoutDebug =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === "true";

function formatPaymentMethodLabel(method: string) {
  if (method === "woocommerce_payments") {
    return "WooPayments";
  }

  return method
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function describePaymentMethod(method: string) {
  if (method === "woocommerce_payments") {
    return "Pay securely with your card without leaving this checkout page.";
  }

  if (method === "stripe") {
    return "This payment option is temporarily unavailable while secure card fields are being prepared.";
  }

  return "This payment method is available for your current cart.";
}

function getSuccessMessage(paymentStatus: string | null) {
  if (paymentStatus === "pending") {
    return "Your order is confirmed and your payment is being finalized. We will update you as soon as it completes.";
  }

  return "Your payment was received successfully and your order is now confirmed.";
}

export function CheckoutPageClient({
  customer,
}: {
  customer?: WooCustomer | null;
}) {
  const {
    items,
    subtotalCents,
    shippingCents,
    totalCents,
    clearCart,
    paymentMethods,
    cartToken,
    isReady,
    isSyncing,
  } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentData, setPaymentData] = useState<CheckoutPaymentDataEntry[]>([]);
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [checkoutDraft, setCheckoutDraft] = useState<WooStoreCheckout | null>(null);
  const [wooPaymentsConfigState, setWooPaymentsConfigState] =
    useState<WooPaymentsConfigFetchState>(INITIAL_WOOPAYMENTS_CONFIG_STATE);
  const [paymentCollector, setPaymentCollector] = useState<CheckoutPaymentCollector>(
    INITIAL_CHECKOUT_PAYMENT_COLLECTOR,
  );
  const [success, setSuccess] = useState<CheckoutSuccessState | null>(null);
  const [form, setForm] = useState({
    billing: {
      full_name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" "),
      email: customer?.email ?? "",
      phone: customer?.billing.phone ?? "",
      address_1: customer?.billing.address_1 ?? "",
      address_2: customer?.billing.address_2 ?? "",
      city: customer?.billing.city ?? "",
      state: customer?.billing.state ?? "",
      postcode: customer?.billing.postcode ?? "",
      country: customer?.billing.country || "US",
    },
    customerNote: "",
  });
  const checkoutDraftPaymentMethod = checkoutDraft?.payment_method ?? null;

  const availablePaymentMethods = (() => {
    const methods = new Set(paymentMethods);

    if (checkoutDraftPaymentMethod) {
      methods.add(checkoutDraftPaymentMethod);
    }

    return Array.from(methods).filter(Boolean);
  })();

  const activePaymentMethod =
    paymentMethod && availablePaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : getDefaultPaymentMethod(availablePaymentMethods);

  useEffect(() => {
    if (!isCheckoutDebug) {
      return;
    }

    console.info("[checkout-page] payment methods raw response", {
      cartPaymentMethods: paymentMethods,
      checkoutDraftPaymentMethod,
      mergedPaymentMethods: availablePaymentMethods,
      cartTokenPresent: Boolean(cartToken),
    });
  }, [availablePaymentMethods, cartToken, checkoutDraftPaymentMethod, paymentMethods]);

  useEffect(() => {
    if (!isCheckoutDebug) {
      return;
    }

    console.info("[checkout-page] selected payment method", {
      selectedPaymentMethodState: paymentMethod || null,
      activePaymentMethod,
    });
  }, [activePaymentMethod, paymentMethod]);
  const paymentState: CheckoutPaymentState = useMemo(() => {
    if (!activePaymentMethod) {
      return {
        method: "",
        status: "idle",
        message: "Select a payment method to continue.",
        paymentData,
      };
    }

    if (activePaymentMethod === "woocommerce_payments") {
      if (wooPaymentsConfigState.status === "loading") {
        return {
          method: activePaymentMethod,
          status: "requires_backend",
          message: "Preparing secure payment fields.",
          paymentData,
        };
      }

      if (wooPaymentsConfigState.status === "error") {
        return {
          method: activePaymentMethod,
          status: "error",
          message:
            wooPaymentsConfigState.error ??
            "We could not load secure card fields right now. Please refresh the page and try again.",
          paymentData,
        };
      }

      if (!wooPaymentsConfigState.data?.isReady) {
        return {
          method: activePaymentMethod,
          status: "requires_backend",
          message: "Secure payment fields are not ready yet. Please try again in a moment.",
          paymentData,
        };
      }

      if (paymentCollector.status === "error") {
        return {
          method: activePaymentMethod,
          status: "error",
          message:
            paymentCollector.message ??
            "Please review your card details and try again.",
          paymentData,
        };
      }

      return {
        method: activePaymentMethod,
        status: paymentCollector.canSubmit ? "ready" : "placeholder",
        message: paymentCollector.canSubmit
          ? "Your card details are ready."
          : paymentCollector.message ??
            "Complete your card details to continue.",
        paymentData,
      };
    }

    return {
      method: activePaymentMethod,
      status: paymentData.length ? "ready" : "requires_backend",
      message: paymentData.length
        ? `${formatPaymentMethodLabel(activePaymentMethod)} is ready.`
        : `${formatPaymentMethodLabel(activePaymentMethod)} is not available for checkout yet.`,
      paymentData,
    };
  }, [activePaymentMethod, paymentCollector, paymentData, wooPaymentsConfigState]);
  const disabled = useMemo(
    () =>
      !items.length ||
      submitPhase !== "idle" ||
      isSyncing ||
      !activePaymentMethod ||
      paymentState.status !== "ready",
    [activePaymentMethod, isSyncing, items.length, paymentState.status, submitPhase],
  );
  const canLoadDraft = isReady && Boolean(cartToken) && items.length > 0;

  useEffect(() => {
    if (!canLoadDraft || !cartToken) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "GET",
          headers: {
            "Cart-Token": cartToken,
          },
        });

        const payload = (await response.json()) as {
          message?: string;
          checkout?: WooStoreCheckout;
        };

        if (isCancelled) {
          return;
        }

        if (!response.ok || !payload.checkout) {
          setCheckoutDraft(null);
          if (isCheckoutDebug) {
            console.warn("[checkout-page] unable to load checkout draft", payload.message);
          }
          return;
        }

        if (isCheckoutDebug) {
          console.info("[checkout-page] loaded Store API draft", {
            orderId: payload.checkout.order_id,
            status: payload.checkout.status,
            paymentMethod: payload.checkout.payment_method,
          });
        }

        setCheckoutDraft(payload.checkout);
      } catch (error) {
        if (!isCancelled) {
          if (isCheckoutDebug) {
            console.error("[checkout-page] failed to load Store API draft", error);
          }
          setCheckoutDraft(null);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [canLoadDraft, cartToken]);

  function validateBillingFields() {
    const nextErrors: FieldErrors = {};

    if (!form.billing.full_name.trim()) {
      nextErrors.full_name = "Please enter your full name.";
    }

    if (!form.billing.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    }

    if (!form.billing.address_1.trim()) {
      nextErrors.address_1 = "Please enter your address.";
    }

    if (!form.billing.address_2.trim()) {
      nextErrors.address_2 = "Please enter your apartment, suite, or unit.";
    }

    if (!form.billing.city.trim()) {
      nextErrors.city = "Please enter your city.";
    }

    if (!form.billing.state.trim()) {
      nextErrors.state = "Please select your state.";
    }

    if (!form.billing.country.trim()) {
      nextErrors.country = "Please select your country.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function finalizeSuccessfulCheckout(nextSuccess: CheckoutSuccessState) {
    try {
      await clearCart();
    } catch (error) {
      if (isCheckoutDebug) {
        console.warn("[checkout-page] unable to clear cart after success", error);
      }
    }

    setFeedback(null);
    setSubmitPhase("idle");
    setSuccess(nextSuccess);
  }

  async function confirmWooPaymentsCheckout(input: {
    redirectUrl: string;
  }) {
    const confirmation = parseWooPaymentsConfirmationRedirect(input.redirectUrl);

    if (!confirmation) {
      return {
        ok: true as const,
        returnUrl: input.redirectUrl,
        orderKey: extractOrderKeyFromUrl(input.redirectUrl),
      };
    }

    const config = wooPaymentsConfigState.data?.config;
    if (!config) {
      return {
        ok: false as const,
        message:
          "Your payment needs one more confirmation step, but secure payment verification is not ready right now.",
      };
    }

    const stripe = await getWooPaymentsStripe(config);
    if (!stripe) {
      return {
        ok: false as const,
        message:
          "We could not start the final payment confirmation. Please refresh the page and try again.",
      };
    }

    const result =
      confirmation.intentKind === "setup"
        ? confirmation.confirmationToken
          ? await stripe.confirmSetup({
              clientSecret: confirmation.clientSecret,
              confirmParams: {
                confirmation_token: confirmation.confirmationToken,
              },
              redirect: "if_required",
            })
          : await stripe.handleNextAction({
              clientSecret: confirmation.clientSecret,
            })
        : await stripe.handleNextAction({
            clientSecret: confirmation.clientSecret,
          });

    const confirmationErrorMessage =
      result.error ||
      ("paymentIntent" in result && result.paymentIntent?.status === "requires_action")
        ? getWooPaymentsConfirmationErrorMessage(
            result,
            config.genericErrorMessage || "Your payment confirmation could not be completed.",
          )
        : null;

    const intentId = getWooPaymentsIntentId(result);
    if (!intentId) {
      return {
        ok: false as const,
        message:
          "We could not verify your payment confirmation. Please contact support if you were charged.",
      };
    }

    const response = await fetch("/api/checkout/woopayments-confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: confirmation.orderId,
        intentId,
        nonce: confirmation.nonce,
        shouldSavePaymentMethod: false,
        isChangingPayment: false,
      }),
    });

    const payload = (await response.json()) as {
      message?: string;
      returnUrl?: string;
    };

    if (!response.ok || !payload.returnUrl) {
      return {
        ok: false as const,
        message:
          payload.message ??
          "Your payment was authorized, but we could not finish confirming the order.",
      };
    }

    if (confirmationErrorMessage) {
      return {
        ok: false as const,
        message: confirmationErrorMessage,
      };
    }

    return {
      ok: true as const,
      returnUrl: payload.returnUrl,
      orderKey: extractOrderKeyFromUrl(payload.returnUrl),
    };
  }

  async function submit() {
    setFeedback(null);

    if (!validateBillingFields()) {
      setFeedback({
        tone: "error",
        text: "Please correct the highlighted checkout fields.",
      });
      return;
    }

    if (!cartToken) {
      setFeedback({
        tone: "error",
        text: "Your cart session expired. Please refresh the page and try again.",
      });
      return;
    }

    if (!activePaymentMethod) {
      setFeedback({
        tone: "error",
        text: "No payment method is available for your cart right now.",
      });
      return;
    }

    if (paymentState.status !== "ready") {
      setFeedback({
        tone: "error",
        text: paymentState.message ?? "Please complete your payment details to continue.",
      });
      return;
    }

    setSubmitPhase("submitting");
    let checkoutPaymentData = paymentData;

    if (activePaymentMethod === "woocommerce_payments") {
      if (!paymentCollector.collectPaymentData) {
        setSubmitPhase("idle");
        setFeedback({
          tone: "error",
          text: "Secure card fields are still loading. Please wait a moment and try again.",
        });
        return;
      }

      const collection = await paymentCollector.collectPaymentData();

      if (!collection.ok) {
        setSubmitPhase("idle");
        setFeedback({
          tone: "error",
          text: collection.message ?? "We could not verify your card details. Please try again.",
        });
        return;
      }

      checkoutPaymentData = collection.paymentData;
      setPaymentData(collection.paymentData);
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cart-Token": cartToken,
      },
      body: JSON.stringify({
        ...form,
        paymentMethod: activePaymentMethod,
        paymentData: checkoutPaymentData,
      }),
    });

    const payload = (await response.json()) as {
      message?: string;
      orderId?: number;
      orderNumber?: string;
      orderKey?: string;
      redirectUrl?: string | null;
      paymentStatus?: string;
      fieldErrors?: Record<string, string>;
      wooPaymentsConfig?: WooPaymentsConfigResponse;
      paymentResult?: WooStoreCheckout["payment_result"];
    };

    if (!response.ok || !payload.orderId || !payload.orderNumber) {
      setSubmitPhase("idle");
      if (payload.wooPaymentsConfig) {
        setWooPaymentsConfigState({
          status: "success",
          data: payload.wooPaymentsConfig,
          error: null,
        });
      }
      const apiFieldErrors = Object.fromEntries(
        Object.entries(payload.fieldErrors ?? {}).map(([path, value]) => [
          path.replace("billing.", ""),
          value,
        ]),
      );

      setFieldErrors((current) => ({ ...current, ...apiFieldErrors }));
      setFeedback({
        tone: "error",
        text:
          payload.message ??
          "We could not place your order. Please review your details and try again.",
      });
      return;
    }

    const redirectUrl = payload.redirectUrl ?? payload.paymentResult?.redirect_url ?? null;
    const confirmation = parseWooPaymentsConfirmationRedirect(redirectUrl);

    if (activePaymentMethod === "woocommerce_payments" && confirmation) {
      if (isCheckoutDebug) {
        console.info("[checkout-page] WooPayments confirmation required", {
          redirectUrl,
        });
      }

      setSubmitPhase("confirming");
      setFeedback({
        tone: "info",
        text: "Confirming your payment securely. Please keep this page open.",
      });

      const confirmationResult = await confirmWooPaymentsCheckout({
        redirectUrl: confirmation.redirectUrl,
      });

      if (!confirmationResult.ok) {
        setSubmitPhase("idle");
        setFeedback({
          tone: "error",
          text: confirmationResult.message,
        });
        return;
      }

      await finalizeSuccessfulCheckout({
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        orderKey:
          payload.orderKey ??
          confirmationResult.orderKey ??
          extractOrderKeyFromUrl(confirmationResult.returnUrl),
        redirectUrl: confirmationResult.returnUrl,
        paymentStatus: payload.paymentStatus ?? "success",
      });
      return;
    }

    await finalizeSuccessfulCheckout({
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      orderKey: payload.orderKey ?? extractOrderKeyFromUrl(redirectUrl),
      redirectUrl,
      paymentStatus: payload.paymentStatus ?? payload.paymentResult?.payment_status ?? "success",
    });
  }

  if (success) {
    return (
      <section className="content-shell py-16">
        <div className="card-surface mx-auto max-w-3xl p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">
            Order placed
          </p>
          <h1 className="display-font mt-4 text-5xl font-semibold text-ink">
            Thank you for your order.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            {getSuccessMessage(success.paymentStatus)}
          </p>
          <p className="mt-3 text-base leading-7 text-muted">
            Your order number is #{success.orderNumber}. Keep it for future tracking and support.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {success.redirectUrl ? (
              <ButtonLink href={success.redirectUrl} variant="secondary">
                View order details
              </ButtonLink>
            ) : null}
            <ButtonLink
              href={`/api/invoice/${success.orderId}?email=${encodeURIComponent(form.billing.email)}`}
            >
              Download invoice
            </ButtonLink>
            <ButtonLink href="/shop" variant="secondary">
              Continue shopping
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="content-shell py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">
          Checkout
        </p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Complete your order
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">
          Each item is printed after ordering. Please allow a short production window before
          shipment.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-8">
          <div className="card-surface p-6">
            <h2 className="display-font text-3xl font-semibold text-ink">Billing details</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Full Name *
                <Input
                  value={form.billing.full_name}
                  className={fieldErrors.full_name ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, full_name: event.target.value },
                    }))
                  }
                />
                {fieldErrors.full_name ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.full_name}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Email *
                <Input
                  value={form.billing.email}
                  type="email"
                  className={fieldErrors.email ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, email: event.target.value },
                    }))
                  }
                />
                {fieldErrors.email ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.email}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Phone (Optional)
                <Input
                  value={form.billing.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, phone: event.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Address *
                <Input
                  value={form.billing.address_1}
                  className={fieldErrors.address_1 ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, address_1: event.target.value },
                    }))
                  }
                />
                {fieldErrors.address_1 ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.address_1}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Apartment / Suite / Unit *
                <Input
                  value={form.billing.address_2}
                  className={fieldErrors.address_2 ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, address_2: event.target.value },
                    }))
                  }
                />
                {fieldErrors.address_2 ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.address_2}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Country *
                <Input
                  value={form.billing.country}
                  className={fieldErrors.country ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, country: event.target.value },
                    }))
                  }
                />
                {fieldErrors.country ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.country}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                State *
                <Input
                  value={form.billing.state}
                  className={fieldErrors.state ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, state: event.target.value },
                    }))
                  }
                />
                {fieldErrors.state ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.state}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                City *
                <Input
                  value={form.billing.city}
                  className={fieldErrors.city ? "border-[#b55245]" : ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, city: event.target.value },
                    }))
                  }
                />
                {fieldErrors.city ? (
                  <span className="text-xs text-[#b55245]">{fieldErrors.city}</span>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Postal Code / ZIP (Optional)
                <Input
                  value={form.billing.postcode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billing: { ...current.billing, postcode: event.target.value },
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="display-font text-3xl font-semibold text-ink">Payment</h2>
            <div className="mt-3 rounded-[1.4rem] bg-sand px-4 py-3 text-sm leading-7 text-muted">
              Your payment is processed securely through WooPayments on this page.
            </div>
            <div className="mt-6 space-y-3">
              {availablePaymentMethods.length ? (
                availablePaymentMethods.map((method) => (
                  <label
                    key={method}
                    className={`block rounded-[1.4rem] border p-4 ${
                      activePaymentMethod === method
                        ? "border-forest bg-forest/5"
                        : "border-border bg-white/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="sr-only"
                      checked={activePaymentMethod === method}
                      onChange={() => {
                        setPaymentMethod(method);
                        setPaymentData([]);
                        setPaymentCollector(INITIAL_CHECKOUT_PAYMENT_COLLECTOR);
                        setFeedback(null);
                      }}
                    />
                    <span className="block text-sm font-semibold text-ink">
                      {formatPaymentMethodLabel(method)}
                    </span>
                    <span className="mt-1 block text-sm leading-7 text-muted">
                      {describePaymentMethod(method)}
                    </span>
                  </label>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-[#b55245]/30 bg-[#b55245]/5 p-4 text-sm text-[#7d3028]">
                  No payment methods are available for your cart right now.
                </div>
              )}
            </div>
            <WooPaymentsInlinePaymentSection
              paymentState={paymentState}
              billing={form.billing}
              cartToken={cartToken}
              onConfigStateChange={setWooPaymentsConfigState}
              onCollectorChange={setPaymentCollector}
            />
            <label className="mt-6 grid gap-2 text-sm font-semibold text-ink">
              Order Note
              <Textarea
                value={form.customerNote}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerNote: event.target.value }))
                }
                placeholder="Delivery notes, gate code, or support details."
              />
            </label>
            {feedback ? (
              <p
                className={`mt-4 text-sm ${
                  feedback.tone === "error" ? "text-[#b55245]" : "text-forest"
                }`}
              >
                {feedback.text}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="card-surface h-fit p-6 lg:sticky lg:top-24">
          <h2 className="display-font text-3xl font-semibold text-ink">Order summary</h2>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-ink">
                    {item.name} x {item.quantity}
                  </p>
                  {item.selectedAttributes ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {Object.values(item.selectedAttributes).join(" / ")}
                    </p>
                  ) : null}
                </div>
                <p className="font-medium text-ink">
                  {formatPriceFromCents(item.priceCents * item.quantity)}
                </p>
              </div>
            ))}
            <div className="border-t border-border pt-4 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPriceFromCents(subtotalCents)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Shipping</span>
                <span>{shippingCents ? formatPriceFromCents(shippingCents) : "Free"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatPriceFromCents(totalCents)}</span>
              </div>
            </div>
            <Button type="button" className="mt-2 w-full" disabled={disabled} onClick={submit}>
              {submitPhase === "confirming"
                ? "Confirming payment..."
                : submitPhase === "submitting"
                  ? "Processing payment..."
                : paymentState.status === "ready"
                  ? "Place order"
                  : "Complete payment details"}
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
