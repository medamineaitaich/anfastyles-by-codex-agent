"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json()) as { message?: string };
    setPending(false);

    if (response.ok) {
      setEmail("");
      setMessage(payload.message ?? "Thanks for subscribing.");
      return;
    }

    setMessage(payload.message ?? "Unable to save your email.");
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Enter your email"
          className="h-13 rounded-full bg-white"
        />
        <Button
          type="button"
          className="h-13 shrink-0 px-7"
          onClick={submit}
          disabled={pending || !email}
        >
          {pending ? "Joining..." : "Subscribe"}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-white/85">{message}</p> : null}
    </div>
  );
}
