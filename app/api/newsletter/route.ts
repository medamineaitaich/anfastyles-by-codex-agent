import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export async function POST(request: Request) {
  try {
    const payload = newsletterSchema.parse(await request.json());
    console.log("AnfaStyles newsletter signup", payload);
    return NextResponse.json({
      ok: true,
      message: "Thanks for joining the Soil Community.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unable to save your email.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
