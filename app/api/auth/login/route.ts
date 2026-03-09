import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getCustomerHint, saveCustomerHint } from "@/lib/session";
import { findCustomerByEmail, verifyWordPressLogin } from "@/lib/woo/client";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const customer = await findCustomerByEmail(payload.email);

    const identifiers = customer
      ? Array.from(new Set([payload.email, customer.username]))
      : [payload.email];
    let valid = false;

    for (const identifier of identifiers) {
      valid = await verifyWordPressLogin(identifier, payload.password);
      if (valid) {
        break;
      }
    }

    if (!valid) {
      return NextResponse.json({ message: "Incorrect email or password." }, { status: 401 });
    }

    let sessionPayload = customer
      ? {
          customerId: customer.id,
          email: customer.email,
          username: customer.username,
          firstName: customer.first_name,
          lastName: customer.last_name,
        }
      : null;

    if (!sessionPayload) {
      const hint = await getCustomerHint();
      if (hint && hint.email.toLowerCase() === payload.email.toLowerCase()) {
        sessionPayload = hint;
      }
    }

    if (!sessionPayload) {
      const refreshedCustomer = await findCustomerByEmail(payload.email);
      if (refreshedCustomer) {
        sessionPayload = {
          customerId: refreshedCustomer.id,
          email: refreshedCustomer.email,
          username: refreshedCustomer.username,
          firstName: refreshedCustomer.first_name,
          lastName: refreshedCustomer.last_name,
        };
      }
    }

    if (!sessionPayload) {
      return NextResponse.json({ message: "No account found for that email." }, { status: 404 });
    }

    await createSession(sessionPayload);
    await saveCustomerHint(sessionPayload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
