import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/session";
import { findCustomerByEmail, verifyWordPressLogin } from "@/lib/woo/client";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const customer = await findCustomerByEmail(payload.email);

    if (!customer) {
      return NextResponse.json({ message: "No account found for that email." }, { status: 404 });
    }

    const valid = await verifyWordPressLogin(customer.username, payload.password);
    if (!valid) {
      return NextResponse.json({ message: "Incorrect email or password." }, { status: 401 });
    }

    await createSession({
      customerId: customer.id,
      email: customer.email,
      username: customer.username,
      firstName: customer.first_name,
      lastName: customer.last_name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
