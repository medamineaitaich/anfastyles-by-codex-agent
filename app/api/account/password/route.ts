import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getCustomer, updateCustomer, verifyWordPressLogin } from "@/lib/woo/client";

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = passwordSchema.parse(await request.json());
    const customer = await getCustomer(session.customerId);
    const valid = await verifyWordPressLogin(customer.username, payload.currentPassword);

    if (!valid) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 });
    }

    await updateCustomer(session.customerId, { password: payload.newPassword });

    const confirmed = await verifyWordPressLogin(customer.username, payload.newPassword);
    if (!confirmed) {
      return NextResponse.json(
        {
          message:
            "The WooCommerce backend did not confirm password sync for headless login. This storefront can update profile data, but password changes still need backend support confirmation.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update password.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
