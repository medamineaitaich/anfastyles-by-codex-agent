"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SUBJECT_OPTIONS = ["General question", "Order support", "Refund request"] as const;

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const initialSubject = useMemo(() => {
    const normalized = defaultSubject?.trim().toLowerCase();
    if (normalized === "refund" || normalized === "refund-request") {
      return "Refund request";
    }

    const matched = SUBJECT_OPTIONS.find(
      (option) => option.toLowerCase() === normalized,
    );

    return matched ?? "General question";
  }, [defaultSubject]);

  const [form, setForm] = useState({
    firstName: "",
    email: "",
    subject: initialSubject,
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
      setForm({
        firstName: "",
        email: "",
        subject: initialSubject,
        orderNumber: "",
        message: "",
      });
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
          Subject
          <select
            value={form.subject}
            className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none"
            onChange={(event) =>   setForm((current) => ({     ...current,     subject: event.target.value as       | "General question"       | "Order support"       | "Refund request",   })) }
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
