export type CheckoutPaymentDataValue = string | number | boolean;

export type CheckoutPaymentDataEntry = {
  key: string;
  value: CheckoutPaymentDataValue;
};

export type CheckoutBillingDetails = {
  full_name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type CheckoutPaymentStateStatus =
  | "idle"
  | "placeholder"
  | "ready"
  | "requires_backend"
  | "error";

export type CheckoutPaymentState = {
  method: string;
  status: CheckoutPaymentStateStatus;
  message: string | null;
  paymentData: CheckoutPaymentDataEntry[];
};

export type CheckoutPaymentDataContract = {
  transport: "wc/store/v1/checkout.payment_data";
  shape: "Array<{ key: string; value: string | number | boolean }>";
  serialization: "The API route serializes values to strings before forwarding them to Woo Store API.";
  notes: string[];
  exampleEntries: CheckoutPaymentDataEntry[];
};

export type WooPaymentsBillingFieldConfig = {
  required: boolean;
};

export type WooPaymentsPaymentMethodConfig = {
  title?: string;
  description?: string;
  isReusable?: boolean;
  showSaveOption?: boolean;
  supportsDeferredIntent?: boolean;
  countries?: string[];
  enabledPaymentMethods?: string[];
  testingInstructions?: string;
  icon?: string;
  darkIcon?: string;
  isBnpl?: boolean;
  isExpressCheckout?: boolean;
  gatewayId?: string;
  forceNetworkSavedCards?: boolean;
};

export type WooPaymentsMountConfig = {
  publishableKey: string;
  accountId: string;
  locale: string;
  currency: string;
  cartTotal: number;
  paymentMethodsConfig: Record<string, WooPaymentsPaymentMethodConfig>;
  testMode: boolean;
  forceNetworkSavedCards: boolean;
  stylesCacheVersion: string;
  isSavedCardsEnabled: boolean;
  enabledBillingFields: Record<string, WooPaymentsBillingFieldConfig>;
  genericErrorMessage: string;
  fraudServices?: Record<string, unknown>;
};

export type WooPaymentsConfigSource =
  | "wordpress_admin_gateway_and_store_cart"
  | "wordpress_woopayments_endpoint";

export type WooPaymentsExpressCheckoutConfig = {
  enabled: boolean;
  productPageEnabled: boolean;
  cartPageEnabled: boolean;
  checkoutPageEnabled: boolean;
  productPageMethods: string[];
  cartPageMethods: string[];
  checkoutPageMethods: string[];
  buttonTheme: string | null;
  buttonType: string | null;
  buttonSize: string | null;
};

export type WooPaymentsMountConfigSnapshot = {
  publishableKey: string | null;
  accountId: string | null;
  locale: string;
  currency: string | null;
  cartTotal: number | null;
  paymentMethodsConfig: Record<string, WooPaymentsPaymentMethodConfig> | null;
  testMode: boolean;
  forceNetworkSavedCards: boolean | null;
  stylesCacheVersion: string | null;
  isSavedCardsEnabled: boolean | null;
  enabledBillingFields: Record<string, WooPaymentsBillingFieldConfig> | null;
  genericErrorMessage: string | null;
  fraudServices?: Record<string, unknown> | null;
  expressCheckout: WooPaymentsExpressCheckoutConfig | null;
  detectedPaymentMethodTypes: string[];
};

export type WooPaymentsConfigField =
  | "publishableKey"
  | "accountId"
  | "currency"
  | "locale"
  | "cartTotal"
  | "paymentMethodsConfig"
  | "forceNetworkSavedCards"
  | "stylesCacheVersion"
  | "isSavedCardsEnabled"
  | "enabledBillingFields"
  | "genericErrorMessage";

export type WooPaymentsConfigResponse = {
  ok: boolean;
  source: WooPaymentsConfigSource;
  message: string;
  isReady: boolean;
  productionSafe: boolean;
  fallbackUsed: boolean;
  config: WooPaymentsMountConfig | null;
  configSnapshot: WooPaymentsMountConfigSnapshot;
  missingFields: WooPaymentsConfigField[];
  missingRequirements: WooPaymentsBackendRequirement[];
  debug?: Record<string, unknown>;
  blocksData?: Record<string, unknown>;
};

export type WooPaymentsConfigFetchState = {
  status: "idle" | "loading" | "success" | "error";
  data: WooPaymentsConfigResponse | null;
  error: string | null;
};

export type WooPaymentsBackendRequirement = {
  id:
    | "publishable_key"
    | "account_id"
    | "cart_context"
    | "payment_methods_config"
    | "saved_cards_config"
    | "billing_fields_config"
    | "styles_cache_version"
    | "generic_error_message"
    | "server_validation_contract";
  label: string;
  reason: string;
};

export type WooPaymentsSdkPaymentDataCandidate = {
  key: string;
  value: CheckoutPaymentDataValue | null | undefined;
};

export type WooPaymentsSdkPaymentDataAdapterResult = {
  paymentData: CheckoutPaymentDataEntry[];
  ready: boolean;
  note: string;
};

export type CheckoutPaymentCollectionResult = {
  ok: boolean;
  paymentData: CheckoutPaymentDataEntry[];
  message: string | null;
};

export type CheckoutPaymentCollector = {
  status: "idle" | "mounting" | "ready" | "error";
  canSubmit: boolean;
  message: string | null;
  collectPaymentData: (() => Promise<CheckoutPaymentCollectionResult>) | null;
};

export const CHECKOUT_PAYMENT_DATA_CONTRACT: CheckoutPaymentDataContract = {
  transport: "wc/store/v1/checkout.payment_data",
  shape: "Array<{ key: string; value: string | number | boolean }>",
  serialization:
    "The API route serializes values to strings before forwarding them to Woo Store API.",
  notes: [
    "WooPayments card checkout creates a Stripe PaymentMethod client-side before Store API checkout submission.",
    "The checkout page owns collection state; the API route only validates and forwards.",
    "No final Store API submit should happen until the selected payment method marks its data as ready.",
  ],
  exampleEntries: [
    { key: "payment_method", value: "woocommerce_payments" },
    { key: "wcpay-payment-method", value: "pm_placeholder" },
    { key: "wcpay-fraud-prevention-token", value: "" },
    { key: "wcpay-fingerprint", value: "" },
    { key: "wc-woocommerce_payments-new-payment-method", value: false },
  ],
};

export const WOOPAYMENTS_BACKEND_REQUIREMENTS: WooPaymentsBackendRequirement[] = [
  {
    id: "publishable_key",
    label: "WooPayments/Stripe publishable key",
    reason: "Required to initialize the client-side payment library securely in the browser.",
  },
  {
    id: "account_id",
    label: "WooPayments Stripe account ID",
    reason: "Needed to mirror the official WooPayments client bootstrap and support account-scoped Stripe initialization.",
  },
  {
    id: "cart_context",
    label: "Woo Store cart context",
    reason: "Required for the current cart currency, total, and checkout session alignment through Cart-Token.",
  },
  {
    id: "payment_methods_config",
    label: "WooPayments payment methods config",
    reason: "The official inline mount expects method-level config, not only a flat list of payment method IDs.",
  },
  {
    id: "saved_cards_config",
    label: "Saved cards and network card flags",
    reason: "WooPayments mount behavior depends on whether saved cards and network-saved cards are enabled.",
  },
  {
    id: "billing_fields_config",
    label: "Enabled billing fields config",
    reason: "WooPayments maps its Stripe payment method creation to the active checkout billing fields.",
  },
  {
    id: "styles_cache_version",
    label: "WooPayments styles cache version",
    reason: "The official integration uses this to keep the secure payment element appearance in sync.",
  },
  {
    id: "generic_error_message",
    label: "WooPayments generic error message",
    reason: "Keeps checkout failures aligned with the official WooPayments messaging contract.",
  },
  {
    id: "server_validation_contract",
    label: "Exact WooPayments payment_data keys expected by process_payment",
    reason: "We need the final list of payment_data keys so the Next.js client can submit the right payload to Store API.",
  },
];

export const EMPTY_WOOPAYMENTS_EXPRESS_CHECKOUT_CONFIG: WooPaymentsExpressCheckoutConfig = {
  enabled: false,
  productPageEnabled: false,
  cartPageEnabled: false,
  checkoutPageEnabled: false,
  productPageMethods: [],
  cartPageMethods: [],
  checkoutPageMethods: [],
  buttonTheme: null,
  buttonType: null,
  buttonSize: null,
};

export const INITIAL_WOOPAYMENTS_CONFIG_STATE: WooPaymentsConfigFetchState = {
  status: "idle",
  data: null,
  error: null,
};

export const INITIAL_CHECKOUT_PAYMENT_COLLECTOR: CheckoutPaymentCollector = {
  status: "idle",
  canSubmit: false,
  message: null,
  collectPaymentData: null,
};

export function adaptWooPaymentsSdkCandidatesToPaymentData(
  candidates: WooPaymentsSdkPaymentDataCandidate[],
) {
  return candidates
    .filter(
      (candidate): candidate is { key: string; value: CheckoutPaymentDataValue } =>
        Boolean(candidate.key) && candidate.value !== null && candidate.value !== undefined,
    )
    .map((candidate) => ({
      key: candidate.key,
      value: candidate.value,
    }));
}

export function adaptWooPaymentsNewCardSdkResultToPaymentData(input: {
  paymentMethodId: string | null;
  fraudPreventionToken?: string | null;
  fingerprint?: string | null;
  savePaymentMethod?: boolean;
}): WooPaymentsSdkPaymentDataAdapterResult {
  const paymentData = adaptWooPaymentsSdkCandidatesToPaymentData([
    {
      key: "payment_method",
      value: "woocommerce_payments",
    },
    {
      key: "wcpay-payment-method",
      value: input.paymentMethodId,
    },
    {
      key: "wcpay-fraud-prevention-token",
      value: input.fraudPreventionToken ?? "",
    },
    {
      key: "wcpay-fingerprint",
      value: input.fingerprint ?? "",
    },
    {
      key: "wc-woocommerce_payments-new-payment-method",
      value: Boolean(input.savePaymentMethod),
    },
  ]);

  return {
    paymentData,
    ready: Boolean(input.paymentMethodId),
    note:
      "The official WooPayments SDK should convert the created Stripe PaymentMethod into WooPayments Store API payment_data entries here.",
  };
}

export function adaptWooPaymentsPaymentMethodErrorToPaymentData(input: {
  code?: string | null;
  declineCode?: string | null;
  message?: string | null;
  type?: string | null;
  fraudPreventionToken?: string | null;
  fingerprint?: string | null;
}): WooPaymentsSdkPaymentDataAdapterResult {
  const paymentData = adaptWooPaymentsSdkCandidatesToPaymentData([
    {
      key: "payment_method",
      value: "woocommerce_payments",
    },
    {
      key: "wcpay-payment-method",
      value: "woocommerce_payments_payment_method_error",
    },
    {
      key: "wcpay-payment-method-error-code",
      value: input.code ?? "unknown-error",
    },
    {
      key: "wcpay-payment-method-error-decline-code",
      value: input.declineCode ?? "",
    },
    {
      key: "wcpay-payment-method-error-message",
      value: input.message ?? "Unable to create a WooPayments payment method.",
    },
    {
      key: "wcpay-payment-method-error-type",
      value: input.type ?? "validation_error",
    },
    {
      key: "wcpay-fraud-prevention-token",
      value: input.fraudPreventionToken ?? "",
    },
    {
      key: "wcpay-fingerprint",
      value: input.fingerprint ?? "",
    },
  ]);

  return {
    paymentData,
    ready: true,
    note:
      "This mirrors the WooPayments error payload shape if the team decides to record failed payment method creation attempts through Store API checkout.",
  };
}

export function getDefaultPaymentMethod(methods: string[]) {
  if (methods.includes("stripe")) {
    return "stripe";
  }

  if (methods.includes("woocommerce_payments")) {
    return "woocommerce_payments";
  }

  return methods[0] ?? "";
}
