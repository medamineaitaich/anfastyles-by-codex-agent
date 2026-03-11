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
  paymentMethod: z.enum(["cod", "manual"]),
  items: z.array(cartItemSchema).min(1),
});

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName: firstName ?? "",
    lastName: rest.join(" ") || "-",
  };
}

const messageByPath: Record<string, string> = {
  "billing.full_name": "Please enter your full name.",
  "billing.email": "Please enter your email address.",
  "billing.address_1": "Please enter your address.",
  "billing.address_2": "Please enter your apartment, suite, or unit.",
  "billing.city": "Please enter your city.",
  "billing.state": "Please select your state.",
  "billing.country": "Please select your country.",
};

export async function POST(request: Request) {
  const session = await getSession();

  try {
    const payload = checkoutSchema.parse(await request.json());
    const { firstName, lastName } = splitFullName(payload.billing.full_name);
    const billing = {
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

    const order = await createOrder({
      customerId: session?.customerId,
      billing,
      shipping: billing,
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
    if (error instanceof z.ZodError) {
      const fieldErrors = Object.fromEntries(
        error.issues
          .map((issue) => {
            const path = issue.path.join(".");
            return [path, messageByPath[path] ?? "Please review this field."];
          })
          .filter(([path]) => Boolean(path)),
      );

      return NextResponse.json(
        {
          message: "Please correct the highlighted checkout fields.",
          fieldErrors,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unable to place the order.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
