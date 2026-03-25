"use client";

import { useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
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
type ContactResponse = {
  message?: string;
  fieldErrors?: ContactFormErrors;
};

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as ContactResponse;
      setPending(false);

      if (!response.ok) {
        setErrors(payload.fieldErrors ?? {});
        setErrorMessage(payload.fieldErrors ? null : payload.message ?? "Unable to send your message.");
        setSuccessMessage(null);
        return;
      }

      setForm({
        firstName: "",
        email: "",
        subject: initialSubject,
        orderNumber: "",
        message: "",
      });
      setErrors({});
      setErrorMessage(null);
      setSuccessMessage(payload.message ?? "Thanks. Your message has been sent.");
    } catch {
      setPending(false);
      setSuccessMessage(null);
      setErrorMessage("Unable to send your message right now. Please try again.");
    }
  }

  return (
    <div className="card-surface mx-auto max-w-2xl p-8">
      <form className="grid gap-5" onSubmit={submit}>
        {successMessage ? (
          <div className="rounded-[1.75rem] border border-emerald-300 bg-emerald-50 px-5 py-6 text-center text-emerald-900">
            <p className="text-2xl font-semibold">Thanks for contacting us.</p>
            <p className="mt-2 text-sm font-medium">{successMessage}</p>
          </div>
        ) : null}
        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold text-ink">
          First Name
          <Input
            value={form.firstName}
            required
            aria-invalid={Boolean(errors.firstName)}
            className={cn(errors.firstName ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "")}
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
            className={cn(errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "")}
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
            className={cn(errors.message ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "")}
            onChange={(event) => {
              const message = event.target.value;
              setForm((current) => ({ ...current, message }));
              setErrors((current) => ({ ...current, message: undefined }));
            }}
            placeholder="How can we help?"
          />
          {errors.message ? <p className="text-xs font-medium text-red-700">{errors.message}</p> : null}
        </label>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
