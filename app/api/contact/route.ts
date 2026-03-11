import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1),
  email: z.email(),
  subject: z.enum(["General question", "Order support", "Refund request"]),
  orderNumber: z.string().optional(),
  message: z.string().min(12),
});

export async function POST(request: Request) {
  try {
    const payload = contactSchema.parse(await request.json());
    console.log("AnfaStyles contact inquiry", payload);
    return NextResponse.json({
      ok: true,
      message: "Thanks. Your message was recorded for local development testing.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit your message.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
