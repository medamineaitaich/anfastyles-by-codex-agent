import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getCustomer, updateCustomer, verifyWordPressLogin } from "@/lib/woo/client";

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

function formatPasswordValidationMessage(error: z.ZodError) {
  const labels: Record<string, string> = {
    currentPassword: "Current password",
    newPassword: "New password",
  };

  const issues = error.issues
    .map((issue) => {
      const field = issue.path[0];

      if (typeof field !== "string") {
        return null;
      }

      if (issue.code === "too_small" && issue.minimum === 8) {
        return `${labels[field] ?? "This field"} must be at least 8 characters long.`;
      }

      return issue.message;
    })
    .filter((message): message is string => Boolean(message));

  return issues[0] ?? "Please check your password details and try again.";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { message: "Please sign in again before changing your password." },
      { status: 401 },
    );
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
            "Your password was updated, but we could not confirm it from the storefront. Please try signing in again, or contact support if the issue continues.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? formatPasswordValidationMessage(error)
        : error instanceof Error
          ? error.message
          : "Unable to update password.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
