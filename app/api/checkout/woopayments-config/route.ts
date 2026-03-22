import { NextResponse } from "next/server";
import { resolveWooPaymentsClientConfig } from "@/lib/checkout/woopayments-config";

function withStoreHeaders(response: NextResponse, cartToken: string | null, nonce: string | null) {
  if (cartToken) {
    response.headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    response.headers.set("Nonce", nonce);
  }

  return response;
}

function getTokenPreview(token?: string | null) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 12)}...`;
}

export async function GET(request: Request) {
  const cartToken = request.headers.get("Cart-Token");
  const locale = request.headers.get("Accept-Language");

  console.info("[woopayments/config] loading", {
    cartToken: getTokenPreview(cartToken),
    locale,
  });

  try {
    const response = await resolveWooPaymentsClientConfig({ cartToken, locale });

    if (response.isReady) {
      console.info("[woopayments/config] mount-ready", {
        cartToken: getTokenPreview(response.cartToken ?? cartToken),
        source: response.source,
      });
    } else {
      console.warn("[woopayments/config] incomplete", {
        cartToken: getTokenPreview(response.cartToken ?? cartToken),
        source: response.source,
        missingFields: response.missingFields,
      });
    }

    return withStoreHeaders(
      NextResponse.json(response),
      response.cartToken,
      response.nonce,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load WooPayments client config.";

    console.error("[woopayments/config] error", {
      cartToken: getTokenPreview(cartToken),
      message,
    });

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
