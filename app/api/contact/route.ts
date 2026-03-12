import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1),
  email: z.email(),
  subject: z.enum(["General question", "Order support", "Refund request"]),
  orderNumber: z.string().optional(),
  message: z.string().min(12),
});

function formatValidationMessage(error: z.ZodError) {
  const details = error.issues.map((issue) => {
    const field = issue.path[0];

    if (field === "email") {
      return "Enter a valid email address.";
    }

    if (field === "message") {
      return "Message must be at least 12 characters.";
    }

    if (field === "firstName") {
      return "Enter your first name.";
    }

    return issue.message;
  });

  return [...new Set(details)].join(" ");
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
      return NextResponse.json({ message: formatValidationMessage(error) }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to submit your message.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
