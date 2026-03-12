import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1),
  email: z.email(),
  subject: z.enum(["General question", "Order support", "Refund request"]),
  orderNumber: z.string().optional(),
  message: z.string().min(12),
});

type ContactField = "firstName" | "email" | "message";
type ContactFieldErrors = Partial<Record<ContactField, string>>;

function getValidationFeedback(error: z.ZodError) {
  const fieldErrors: ContactFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === "email") {
      fieldErrors.email = "Enter a valid email address.";
      continue;
    }

    if (field === "message") {
      fieldErrors.message = "Message must be at least 12 characters.";
      continue;
    }

    if (field === "firstName") {
      fieldErrors.firstName = "Enter your first name.";
    }
  }

  return {
    fieldErrors,
    message: "Please correct the highlighted fields.",
  };
}

export async function POST(request: Request) {
  try {
    const payload = contactSchema.parse(await request.json());
    console.log("AnfaStyles contact inquiry", payload);
    return NextResponse.json({
      ok: true,
      message: "Thanks. Your message was recorded for local development testing.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const feedback = getValidationFeedback(error);
      return NextResponse.json(feedback, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to submit your message.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
