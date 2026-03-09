import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  getSession,
  saveCustomerHint,
  saveProfileSnapshot,
} from "@/lib/session";
import { getCustomer, updateCustomer } from "@/lib/woo/client";

const profileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  billing: z.object({
    phone: z.string().optional().default(""),
    address_1: z.string().optional().default(""),
    address_2: z.string().optional().default(""),
    city: z.string().optional().default(""),
    state: z.string().optional().default(""),
    postcode: z.string().optional().default(""),
    country: z.string().optional().default("US"),
  }),
  shipping: z.object({
    first_name: z.string().optional().default(""),
    last_name: z.string().optional().default(""),
    address_1: z.string().optional().default(""),
    address_2: z.string().optional().default(""),
    city: z.string().optional().default(""),
    state: z.string().optional().default(""),
    postcode: z.string().optional().default(""),
    country: z.string().optional().default("US"),
  }),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const customer = await getCustomer(session.customerId);
  return NextResponse.json(customer);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = profileSchema.parse(await request.json());
    const customer = await getCustomer(session.customerId);

    const updated = await updateCustomer(session.customerId, {
      first_name: payload.first_name,
      last_name: payload.last_name,
      billing: {
        ...customer.billing,
        ...payload.billing,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: customer.email,
      },
      shipping: {
        ...customer.shipping,
        ...payload.shipping,
        first_name: payload.shipping.first_name || payload.first_name,
        last_name: payload.shipping.last_name || payload.last_name,
      },
    });

    const nextSession = {
      customerId: updated.id,
      email: updated.email,
      username: updated.username || session.username,
      firstName: updated.first_name,
      lastName: updated.last_name,
    };

    await createSession(nextSession);
    await saveCustomerHint(nextSession);
    await saveProfileSnapshot(updated);

    return NextResponse.json({
      message: "Account updated.",
      customer: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update profile.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
