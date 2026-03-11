import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOrderById } from "@/lib/woo/client";
import { buildInvoiceHtml } from "@/lib/invoice";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await context.params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ message: "Invalid order id." }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();

  const canAccessAsCustomer =
    session &&
    (order.customer_id === session.customerId || order.billing.email?.toLowerCase() === session.email);

  const canAccessAsGuest = email && order.billing.email?.toLowerCase() === email;

  if (!canAccessAsCustomer && !canAccessAsGuest) {
    return NextResponse.json({ message: "Invoice access denied." }, { status: 403 });
  }

  return new NextResponse(buildInvoiceHtml(order), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="anfastyles-invoice-${order.number}.html"`,
    },
  });
}
