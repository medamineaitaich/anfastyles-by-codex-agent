"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setPending(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const payload = (await response.json()) as { message?: string };
      setPending(false);

      if (response.ok) {
        setEmail("");
        setMessageType("success");
        setMessage(payload.message ?? "Thanks for subscribing.");
        return;
      }

      setMessageType("error");
      setMessage(payload.message ?? "Unable to save your email.");
    } catch {
      setPending(false);
      setMessageType("error");
      setMessage("Unable to save your email right now. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Enter your email"
          className="h-13 rounded-full bg-white"
        />
        <Button
          type="submit"
          className="h-13 shrink-0 px-7"
          disabled={pending || !email.trim()}
        >
          {pending ? "Joining..." : "Subscribe"}
        </Button>
      </form>
      {message ? (
        <p className={`mt-3 text-sm ${messageType === "error" ? "text-red-200" : "text-white/85"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
