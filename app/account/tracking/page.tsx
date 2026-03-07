import { OrderTrackingClient } from "@/components/account/order-tracking-client";
import { getSession } from "@/lib/session";
import { getOrdersForCustomer } from "@/lib/woo/client";

export default async function TrackingPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const orders = await getOrdersForCustomer(session.customerId, session.email);
  return <OrderTrackingClient orders={orders} />;
}
