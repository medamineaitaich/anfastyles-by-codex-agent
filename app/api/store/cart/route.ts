import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addStoreCartItem,
  clearStoreCart,
  getStoreCart,
  removeStoreCartItem,
  updateStoreCartItem,
  WooStoreApiError,
} from "@/lib/woo/store";

const addItemSchema = z.object({
  productId: z.number().int().positive(),
  variationId: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional(),
});

const updateItemSchema = z.object({
  key: z.string().min(1),
  quantity: z.number().int().min(0),
});

function withStoreHeaders(response: NextResponse, cartToken: string | null, nonce: string | null) {
  if (cartToken) {
    response.headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    response.headers.set("Nonce", nonce);
  }

  return response;
}

function getCartToken(request: Request) {
  return request.headers.get("Cart-Token");
}

function formatStoreError(error: unknown) {
  if (error instanceof WooStoreApiError) {
    return {
      status: error.status,
      body: {
        message: error.message,
        details: error.payload,
      },
      cartToken: error.cartToken,
    };
  }

  return {
    status: 500,
    body: {
      message: error instanceof Error ? error.message : "Unexpected Store API error.",
    },
    cartToken: null,
  };
}

export async function GET(request: Request) {
  try {
    const { data, cartToken, nonce } = await getStoreCart(getCartToken(request));
    return withStoreHeaders(NextResponse.json(data), cartToken, nonce);
  } catch (error) {
    const formatted = formatStoreError(error);
    return withStoreHeaders(
      NextResponse.json(formatted.body, { status: formatted.status }),
      formatted.cartToken,
      null,
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = addItemSchema.parse(await request.json());
    const { data, cartToken, nonce } = await addStoreCartItem(payload, getCartToken(request));
    return withStoreHeaders(NextResponse.json(data), cartToken, nonce);
  } catch (error) {
    const formatted = formatStoreError(error);
    return withStoreHeaders(
      NextResponse.json(formatted.body, { status: formatted.status }),
      formatted.cartToken,
      null,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateItemSchema.parse(await request.json());

    const response =
      payload.quantity === 0
        ? await removeStoreCartItem(payload.key, getCartToken(request))
        : await updateStoreCartItem(payload, getCartToken(request));

    return withStoreHeaders(NextResponse.json(response.data), response.cartToken, response.nonce);
  } catch (error) {
    const formatted = formatStoreError(error);
    return withStoreHeaders(
      NextResponse.json(formatted.body, { status: formatted.status }),
      formatted.cartToken,
      null,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    const response = key
      ? await removeStoreCartItem(key, getCartToken(request))
      : await clearStoreCart(getCartToken(request));

    return withStoreHeaders(NextResponse.json(response.data), response.cartToken, response.nonce);
  } catch (error) {
    const formatted = formatStoreError(error);
    return withStoreHeaders(
      NextResponse.json(formatted.body, { status: formatted.status }),
      formatted.cartToken,
      null,
    );
  }
}
