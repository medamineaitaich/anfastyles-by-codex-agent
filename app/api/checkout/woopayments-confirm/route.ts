import { NextResponse } from "next/server";
import { z } from "zod";

const confirmationSchema = z.object({
  orderId: z.number().int().positive(),
  intentId: z.string().min(1),
  nonce: z.string().min(1),
  shouldSavePaymentMethod: z.boolean().optional().default(false),
  isChangingPayment: z.boolean().optional().default(false),
});

function getWordPressBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_WP_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_WP_BASE_URL environment variable.");
  }

  return baseUrl.replace(/\/$/, "");
}

function buildAjaxUrl() {
  return `${getWordPressBaseUrl()}/wp-admin/admin-ajax.php`;
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

export async function POST(request: Request) {
  try {
    const payload = confirmationSchema.parse(await request.json());
    const body = new URLSearchParams({
      action: "update_order_status",
      order_id: String(payload.orderId),
      intent_id: payload.intentId,
      _ajax_nonce: payload.nonce,
      should_save_payment_method: payload.shouldSavePaymentMethod ? "true" : "false",
      is_changing_payment: payload.isChangingPayment ? "true" : "false",
    });

    const response = await fetch(buildAjaxUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/plain, */*",
      },
      body,
      cache: "no-store",
    });

    const result = await parseResponsePayload(response);

    if (
      !response.ok ||
      !result ||
      typeof result !== "object" ||
      !("return_url" in result) ||
      typeof result.return_url !== "string"
    ) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        result.error &&
        typeof result.error === "object" &&
        "message" in result.error &&
        typeof result.error.message === "string"
          ? result.error.message
          : "We could not confirm your payment right now. Please try again.";

      return NextResponse.json({ message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      returnUrl: result.return_url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "We could not confirm your payment right now. Please try again.",
      },
      { status: 400 },
    );
  }
}
