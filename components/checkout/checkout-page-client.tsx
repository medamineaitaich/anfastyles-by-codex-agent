"use client";

import { useEffect, useMemo, useState } from "react";
import type { WooCustomer, WooStoreCheckout } from "@/lib/woo/types";
import {
  getDefaultPaymentMethod,
  INITIAL_CHECKOUT_PAYMENT_COLLECTOR,
  INITIAL_WOOPAYMENTS_CONFIG_STATE,
  type CheckoutBillingDetails,
  type CheckoutPaymentDataContract,
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
import { useCart } from "@/providers/cart-provider";

type FieldErrors = Partial<Record<keyof CheckoutBillingDetails, string>>;

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
    return "WooPayments is available from WooCommerce Store API. Secure card entry stays inline on this checkout page.";
  }

  if (method === "stripe") {
    return "Stripe is exposed by the Store API for this cart. Payment details still need an inline field integration before final submission.";
  }

  return "This payment method is coming from WooCommerce Store API for the current cart.";
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
  const [message, setMessage] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [checkoutDraft, setCheckoutDraft] = useState<WooStoreCheckout | null>(null);
  const [paymentDataContract, setPaymentDataContract] =
    useState<CheckoutPaymentDataContract | null>(null);
  const [wooPaymentsConfigState, setWooPaymentsConfigState] =
    useState<WooPaymentsConfigFetchState>(INITIAL_WOOPAYMENTS_CONFIG_STATE);
  const [paymentCollector, setPaymentCollector] = useState<CheckoutPaymentCollector>(
    INITIAL_CHECKOUT_PAYMENT_COLLECTOR,
  );
  const [success, setSuccess] = useState<{ orderId: number; orderNumber: string } | null>(null);
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
    console.info("[checkout-page] payment methods raw response", {
      cartPaymentMethods: paymentMethods,
      checkoutDraftPaymentMethod,
      mergedPaymentMethods: availablePaymentMethods,
      cartTokenPresent: Boolean(cartToken),
    });
  }, [availablePaymentMethods, cartToken, checkoutDraftPaymentMethod, paymentMethods]);

  useEffect(() => {
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
          message: "Loading WooPayments client config from the backend.",
          paymentData,
        };
      }

      if (wooPaymentsConfigState.status === "error") {
        return {
          method: activePaymentMethod,
          status: "error",
          message:
            wooPaymentsConfigState.error ??
            "Unable to load the WooPayments client config required for inline checkout.",
          paymentData,
        };
      }

      if (!wooPaymentsConfigState.data?.isReady) {
        return {
          method: activePaymentMethod,
          status: "requires_backend",
          message:
            wooPaymentsConfigState.data?.message ??
            "WooPayments config is not ready for the official SDK mount yet.",
          paymentData,
        };
      }

      if (paymentCollector.status === "error") {
        return {
          method: activePaymentMethod,
          status: "error",
          message:
            paymentCollector.message ??
            "WooPayments card details are invalid. Please review the secure fields and try again.",
          paymentData,
        };
      }

      return {
        method: activePaymentMethod,
        status: paymentCollector.canSubmit ? "ready" : "placeholder",
        message: paymentCollector.canSubmit
          ? "WooPayments card details are ready. A Stripe PaymentMethod will be created on submit."
          : paymentCollector.message ??
            "Complete the secure WooPayments card fields to continue.",
        paymentData,
      };
    }

    return {
      method: activePaymentMethod,
      status: paymentData.length ? "ready" : "requires_backend",
      message: paymentData.length
        ? `${activePaymentMethod} payment data is ready.`
        : `${activePaymentMethod} is selected, but its inline payment collector is not wired yet.`,
      paymentData,
    };
  }, [activePaymentMethod, paymentCollector, paymentData, wooPaymentsConfigState]);
  const disabled = useMemo(
    () =>
      !items.length ||
      pending ||
      isSyncing ||
      !activePaymentMethod ||
      paymentState.status !== "ready",
    [activePaymentMethod, isSyncing, items.length, paymentState.status, pending],
  );
  const canLoadDraft = isReady && Boolean(cartToken) && items.length > 0;
  const activeCheckoutDraft = canLoadDraft ? checkoutDraft : null;
  const activeDraftMessage = canLoadDraft ? draftMessage : null;

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
          paymentDataContract?: CheckoutPaymentDataContract;
        };

        if (isCancelled) {
          return;
        }

        if (!response.ok || !payload.checkout) {
          setCheckoutDraft(null);
          setDraftMessage(payload.message ?? "Unable to load the Store API checkout draft.");
          setPaymentDataContract(payload.paymentDataContract ?? null);
          return;
        }

        console.info("[checkout-page] loaded Store API draft", {
          orderId: payload.checkout.order_id,
          status: payload.checkout.status,
          paymentMethod: payload.checkout.payment_method,
        });

        setCheckoutDraft(payload.checkout);
        setPaymentDataContract(payload.paymentDataContract ?? null);
        setDraftMessage(
          `Store API draft #${payload.checkout.order_number} is ready with status ${payload.checkout.status}.`,
        );
      } catch (error) {
        if (!isCancelled) {
          console.error("[checkout-page] failed to load Store API draft", error);
          setCheckoutDraft(null);
          setDraftMessage("Unable to load the Store API checkout draft.");
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

  async function submit() {
    setMessage(null);

    if (!validateBillingFields()) {
      setMessage("Please correct the highlighted checkout fields.");
      return;
    }

    if (!cartToken) {
      setMessage("Cart token is missing. Refresh the cart and try again.");
      return;
    }

    if (!activePaymentMethod) {
      setMessage("No Store API payment method is available yet for this cart.");
      return;
    }

    if (paymentState.status !== "ready") {
      setMessage(paymentState.message ?? "Payment details are not ready yet.");
      return;
    }

    setPending(true);
    let checkoutPaymentData = paymentData;

    if (activePaymentMethod === "woocommerce_payments") {
      if (!paymentCollector.collectPaymentData) {
        setPending(false);
        setMessage("WooPayments secure fields are not ready yet.");
        return;
      }

      const collection = await paymentCollector.collectPaymentData();

      if (!collection.ok) {
        setPending(false);
        setMessage(collection.message ?? "Unable to create the WooPayments payment method.");
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
      fieldErrors?: Record<string, string>;
      requiresPaymentData?: boolean;
      paymentDataContract?: CheckoutPaymentDataContract;
      wooPaymentsConfig?: WooPaymentsConfigResponse;
      paymentResult?: WooStoreCheckout["payment_result"];
    };

    setPending(false);

    if (!response.ok || !payload.orderId || !payload.orderNumber) {
      setPaymentDataContract(payload.paymentDataContract ?? paymentDataContract);
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
      setMessage(payload.message ?? "Unable to place the order.");
      return;
    }

    if (
      activePaymentMethod === "woocommerce_payments" &&
      payload.paymentResult?.redirect_url
    ) {
      console.info("[checkout-page] WooPayments confirmation required", {
        redirectUrl: payload.paymentResult.redirect_url,
      });

      // TODO: parse payment_result.redirect_url and run the WooPayments/Stripe intent confirmation
      // step in-page without falling back to a full redirect.
      setMessage(
        "WooPayments returned a confirmation step. The next step is in-page intent confirmation from payment_result.redirect_url.",
      );
      return;
    }

    await clearCart();
    setSuccess({ orderId: payload.orderId, orderNumber: payload.orderNumber });
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
            Your order number is #{success.orderNumber}. Keep it for future tracking and support.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
              The final checkout now runs through WooCommerce Store API and uses the live cart token.
              WooPayments secure card entry now mounts inline and creates payment data at submit
              time.
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
                        setMessage(null);
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
                  No payment methods were returned by WooCommerce Store API for this cart yet.
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
            {paymentDataContract ? (
              <div className="mt-6 rounded-[1.4rem] border border-border bg-white px-4 py-4">
                <p className="text-sm font-semibold text-ink">Current payment data contract</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-muted">
                  <p>{paymentDataContract.shape}</p>
                  <p>{paymentDataContract.serialization}</p>
                </div>
              </div>
            ) : null}
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
            {activeDraftMessage ? (
              <p className="mt-4 text-sm text-muted">{activeDraftMessage}</p>
            ) : null}
            {message ? <p className="mt-4 text-sm text-[#b55245]">{message}</p> : null}
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
            {activeCheckoutDraft ? (
              <div className="rounded-[1.4rem] bg-sand px-4 py-3 text-sm text-muted">
                Draft order #{activeCheckoutDraft.order_number} is loaded through Store API with
                status {activeCheckoutDraft.status}.
              </div>
            ) : null}
            <Button type="button" className="mt-2 w-full" disabled={disabled} onClick={submit}>
              {pending
                ? "Submitting checkout..."
                : paymentState.status === "ready"
                  ? "Place order"
                  : "Payment fields required"}
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
