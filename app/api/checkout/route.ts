import { NextResponse } from "next/server";
import { z } from "zod";
import { CHECKOUT_PAYMENT_DATA_CONTRACT } from "@/lib/checkout/payment";
import { resolveWooPaymentsClientConfig } from "@/lib/checkout/woopayments-config";
import {
  getStoreCheckoutDraft,
  submitStoreCheckout,
  WooStoreApiError,
} from "@/lib/woo/store";

const checkoutSchema = z.object({
  billing: z.object({
    full_name: z.string().min(1),
    email: z.email(),
    phone: z.string().optional().default(""),
    address_1: z.string().min(2),
    address_2: z.string().min(1),
    city: z.string().min(2),
    state: z.string().min(2),
    postcode: z.string().optional().default(""),
    country: z.string().min(2),
  }),
  customerNote: z.string().optional(),
  paymentMethod: z.string().min(1),
  paymentData: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.union([z.string(), z.number(), z.boolean()]),
      }),
    )
    .optional()
    .default([]),
});

function getCartToken(request: Request) {
  return request.headers.get("Cart-Token");
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName: firstName ?? "",
    lastName: rest.join(" ") || "-",
  };
}

function withStoreHeaders(response: NextResponse, cartToken: string | null, nonce: string | null) {
  if (cartToken) {
    response.headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    response.headers.set("Nonce", nonce);
  }

  return response;
}

function formatPaymentRequiredMessage(paymentMethod: string) {
  if (paymentMethod === "woocommerce_payments") {
    return "Please complete your card details before placing the order.";
  }

  return `Please complete the payment details for ${paymentMethod} before placing the order.`;
}

function extractStoreErrorMessage(error: WooStoreApiError) {
  const payload = error.payload;

  if (typeof payload === "object" && payload !== null) {
    if (
      "payment_result" in payload &&
      payload.payment_result &&
      typeof payload.payment_result === "object" &&
      "payment_details" in payload.payment_result &&
      Array.isArray(payload.payment_result.payment_details)
    ) {
      const errorDetail = payload.payment_result.payment_details.find(
        (entry): entry is { key: string; value: string } =>
          typeof entry === "object" &&
          entry !== null &&
          "key" in entry &&
          "value" in entry &&
          entry.key === "errorMessage" &&
          typeof entry.value === "string",
      );

      if (errorDetail?.value) {
        return errorDetail.value;
      }
    }

    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  return error.message;
}

export async function GET(request: Request) {
  const cartToken = getCartToken(request);

  if (!cartToken) {
    return NextResponse.json(
      {
        message: "Your cart session expired. Please refresh the page and try again.",
      },
      { status: 400 },
    );
  }

  try {
    const response = await getStoreCheckoutDraft(cartToken);
    return withStoreHeaders(
      NextResponse.json({
        ok: true,
        checkout: response.data,
        paymentDataContract: CHECKOUT_PAYMENT_DATA_CONTRACT,
      }),
      response.cartToken,
      response.nonce,
    );
  } catch (error) {
    if (error instanceof WooStoreApiError) {
      console.error("[woo-store/checkout] draft-error", {
        status: error.status,
        cartToken: error.cartToken ? `${error.cartToken.slice(0, 12)}...` : null,
        payload: error.payload,
      });

      return withStoreHeaders(
        NextResponse.json(
          {
            message: extractStoreErrorMessage(error),
            details: error.payload,
          },
          { status: error.status },
        ),
        error.cartToken,
        null,
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "We could not prepare your checkout right now.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const cartToken = getCartToken(request);

  if (!cartToken) {
    return NextResponse.json(
      {
        message: "Your cart session expired. Please refresh the page and try again.",
      },
      { status: 400 },
    );
  }

  try {
    const payload = checkoutSchema.parse(await request.json());
    const { firstName, lastName } = splitFullName(payload.billing.full_name);
    const billingAddress = {
      first_name: firstName,
      last_name: lastName,
      email: payload.billing.email,
      phone: payload.billing.phone,
      address_1: payload.billing.address_1,
      address_2: payload.billing.address_2,
      city: payload.billing.city,
      state: payload.billing.state,
      postcode: payload.billing.postcode,
      country: payload.billing.country,
    };

    if (!payload.paymentData.length) {
      console.info("[woo-store/checkout] blocked-submit", {
        paymentMethod: payload.paymentMethod,
        reason: "missing_payment_data",
      });

      return NextResponse.json(
        {
          message: formatPaymentRequiredMessage(payload.paymentMethod),
          requiresPaymentData: true,
          paymentDataContract: CHECKOUT_PAYMENT_DATA_CONTRACT,
        },
        { status: 400 },
      );
    }

    if (payload.paymentMethod === "woocommerce_payments") {
      const wooPaymentsConfig = await resolveWooPaymentsClientConfig({
        cartToken,
        locale: request.headers.get("Accept-Language"),
      });

      if (!wooPaymentsConfig.isReady) {
        console.info("[woo-store/checkout] blocked-submit", {
          paymentMethod: payload.paymentMethod,
          reason: "woopayments_config_not_ready",
          missingFields: wooPaymentsConfig.missingFields,
        });

        return withStoreHeaders(
          NextResponse.json(
            {
              message: wooPaymentsConfig.message,
              requiresPaymentData: true,
              paymentDataContract: CHECKOUT_PAYMENT_DATA_CONTRACT,
              wooPaymentsConfig,
            },
            { status: 400 },
          ),
          wooPaymentsConfig.cartToken,
          wooPaymentsConfig.nonce,
        );
      }
    }

    const response = await submitStoreCheckout(
      {
        billingAddress,
        shippingAddress: billingAddress,
        customerNote: payload.customerNote,
        paymentMethod: payload.paymentMethod,
        paymentData: payload.paymentData.map((entry) => ({
          key: entry.key,
          value: String(entry.value),
        })),
      },
      cartToken,
    );

    return withStoreHeaders(
      NextResponse.json({
        ok: true,
        orderId: response.data.order_id,
        orderNumber: response.data.order_number,
        orderKey: response.data.order_key,
        status: response.data.status,
        paymentMethod: response.data.payment_method,
        paymentStatus: response.data.payment_result.payment_status,
        redirectUrl: response.data.payment_result.redirect_url || null,
        paymentResult: response.data.payment_result,
        checkout: response.data,
        paymentDataContract: CHECKOUT_PAYMENT_DATA_CONTRACT,
      }),
      response.cartToken,
      response.nonce,
    );
  } catch (error) {
    if (error instanceof WooStoreApiError) {
      console.error("[woo-store/checkout] submit-error", {
        status: error.status,
        cartToken: error.cartToken ? `${error.cartToken.slice(0, 12)}...` : null,
        payload: error.payload,
      });

      return withStoreHeaders(
        NextResponse.json(
          {
            message: extractStoreErrorMessage(error),
            details: error.payload,
          },
          { status: error.status },
        ),
        error.cartToken,
        null,
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "We could not process your checkout right now. Please try again.",
      },
      { status: 400 },
    );
  }
}
