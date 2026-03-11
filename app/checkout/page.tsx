import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { getSession } from "@/lib/session";
import { getCustomer } from "@/lib/woo/client";

export default async function CheckoutPage() {
  const session = await getSession();
  const customer = session ? await getCustomer(session.customerId) : null;

  return <CheckoutPageClient customer={customer} />;
}
