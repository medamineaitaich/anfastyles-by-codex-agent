import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createReview, getCustomer } from "@/lib/woo/client";

const reviewSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1).max(5),
  review: z.string().min(20),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in to leave a review." }, { status: 401 });
  }

  try {
    const payload = reviewSchema.parse(await request.json());
    const customer = await getCustomer(session.customerId);

    await createReview({
      productId: payload.productId,
      rating: payload.rating,
      review: payload.review,
      reviewer: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
      reviewerEmail: customer.email,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit review.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
