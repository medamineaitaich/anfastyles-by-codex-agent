import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, saveCustomerHint } from "@/lib/session";
import { createCustomer, findCustomerByEmail } from "@/lib/woo/client";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const existing = await findCustomerByEmail(payload.email);

    if (existing) {
      return NextResponse.json(
        { message: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const usernameBase = slugify(`${payload.firstName}-${payload.lastName}`) || "anfastyles";
    const username = `${usernameBase}-${Math.random().toString(36).slice(2, 7)}`;

    const customer = await createCustomer({
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: payload.password,
      username,
    });

    const sessionPayload = {
      customerId: customer.id,
      email: customer.email,
      username: customer.username,
      firstName: customer.first_name,
      lastName: customer.last_name,
    };

    await createSession(sessionPayload);
    await saveCustomerHint(sessionPayload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the account right now.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
