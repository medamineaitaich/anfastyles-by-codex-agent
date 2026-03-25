"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as { message?: string };
    setPending(false);

    if (!response.ok) {
      setMessage(payload.message ?? "Unable to create the account.");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="card-surface mx-auto max-w-xl p-8">
      <form className="grid gap-5" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            First Name
            <Input
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Last Name
            <Input
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({ ...current, lastName: event.target.value }))
              }
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Email Address
          <Input
            value={form.email}
            type="email"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Password
          <Input
            value={form.password}
            type="password"
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
          />
        </label>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
        {message ? <p className="text-sm text-[#b55245]">{message}</p> : null}
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-forest">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
