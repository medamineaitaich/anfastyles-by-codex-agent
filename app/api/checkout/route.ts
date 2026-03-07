import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createOrder } from "@/lib/woo/client";

const cartItemSchema = z.object({
  key: z.string(),
  productId: z.number(),
  variationId: z.number().optional(),
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  priceCents: z.number(),
  quantity: z.number().min(1),
  type: z.enum(["simple", "variable", "grouped", "external"]),
  selectedAttributes: z.record(z.string(), z.string()).optional(),
});

const checkoutSchema = z.object({
  billing: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.email(),
    phone: z.string().min(7),
    address_1: z.string().min(2),
    address_2: z.string().optional().default(""),
    city: z.string().min(2),
    state: z.string().min(2),
    postcode: z.string().min(2),
    country: z.string().min(2),
  }),
  shipping: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    address_1: z.string().min(2),
    address_2: z.string().optional().default(""),
    city: z.string().min(2),
    state: z.string().min(2),
    postcode: z.string().min(2),
    country: z.string().min(2),
  }),
  customerNote: z.string().optional(),
  paymentMethod: z.enum(["cod", "manual"]),
  items: z.array(cartItemSchema).min(1),
});

export async function POST(request: Request) {
  const session = await getSession();

  try {
    const payload = checkoutSchema.parse(await request.json());
    const order = await createOrder({
      customerId: session?.customerId,
      billing: payload.billing,
      shipping: payload.shipping,
      customerNote: payload.customerNote,
      paymentMethod: payload.paymentMethod,
      items: payload.items,
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.number,
      status: order.status,
      paymentUrl: order.payment_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place the order.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
