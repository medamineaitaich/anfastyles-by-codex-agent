"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    orderNumber: "",
    message: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setStatus(null);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as { message?: string };
    setPending(false);
    setStatus(payload.message ?? (response.ok ? "Message sent." : "Unable to send."));

    if (response.ok) {
      setForm({ firstName: "", email: "", orderNumber: "", message: "" });
    }
  }

  return (
    <div className="card-surface mx-auto max-w-2xl p-8">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          First Name
          <Input
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Email Address
          <Input
            value={form.email}
            type="email"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Order Number (Optional)
          <Input
            value={form.orderNumber}
            onChange={(event) =>
              setForm((current) => ({ ...current, orderNumber: event.target.value }))
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Message
          <Textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder="How can we help?"
          />
        </label>
        <Button type="button" className="w-full" disabled={pending} onClick={submit}>
          {pending ? "Sending..." : "Send Message"}
        </Button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>
    </div>
  );
}
