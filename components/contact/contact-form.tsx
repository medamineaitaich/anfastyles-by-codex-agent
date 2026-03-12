"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SUBJECT_OPTIONS = ["General question", "Order support", "Refund request"] as const;
type SubjectOption = (typeof SUBJECT_OPTIONS)[number];
type ContactFormState = {
  firstName: string;
  email: string;
  subject: SubjectOption;
  orderNumber: string;
  message: string;
};
type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

function validateForm(form: ContactFormState) {
  const errors: ContactFormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "Enter your first name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (form.message.trim().length < 12) {
    errors.message = "Message must be at least 12 characters.";
  }

  return errors;
}

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

  const [form, setForm] = useState<ContactFormState>({
    firstName: "",
    email: "",
    subject: initialSubject,
    orderNumber: "",
    message: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("Please correct the highlighted fields.");
      return;
    }

    setPending(true);
    setStatus(null);
    setErrors({});

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
      setErrors({});
    }
  }

  return (
    <div className="card-surface mx-auto max-w-2xl p-8">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          First Name
          <Input
            value={form.firstName}
            required
            aria-invalid={Boolean(errors.firstName)}
            onChange={(event) => {
              const firstName = event.target.value;
              setForm((current) => ({ ...current, firstName }));
              setErrors((current) => ({ ...current, firstName: undefined }));
            }}
          />
          {errors.firstName ? <p className="text-xs font-medium text-red-700">{errors.firstName}</p> : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Email Address
          <Input
            value={form.email}
            type="email"
            required
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => {
              const email = event.target.value;
              setForm((current) => ({ ...current, email }));
              setErrors((current) => ({ ...current, email: undefined }));
            }}
          />
          {errors.email ? <p className="text-xs font-medium text-red-700">{errors.email}</p> : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Subject
          <select
            value={form.subject}
            className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none"
            onChange={(event) => {
              const subject =
                SUBJECT_OPTIONS.find((option) => option === event.target.value) ?? "General question";
              setForm((current) => ({ ...current, subject }));
            }}
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
            required
            minLength={12}
            aria-invalid={Boolean(errors.message)}
            onChange={(event) => {
              const message = event.target.value;
              setForm((current) => ({ ...current, message }));
              setErrors((current) => ({ ...current, message: undefined }));
            }}
            placeholder="How can we help?"
          />
          {errors.message ? <p className="text-xs font-medium text-red-700">{errors.message}</p> : null}
        </label>
        <Button type="button" className="w-full" disabled={pending} onClick={submit}>
          {pending ? "Sending..." : "Send Message"}
        </Button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>
    </div>
  );
}
