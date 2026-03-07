import { NextResponse } from "next/server";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.email(),
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
    const message = error instanceof Error ? error.message : "Unable to save your email.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
