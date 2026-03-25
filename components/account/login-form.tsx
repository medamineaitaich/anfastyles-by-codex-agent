"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { message?: string };
    setPending(false);

    if (!response.ok) {
      setMessage(payload.message ?? "Unable to sign in.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="card-surface mx-auto max-w-xl p-8">
      <form className="space-y-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Email Address
          <Input value={email} type="email" onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Password
          <Input
            value={password}
            type="password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign In"}
        </Button>
        {message ? <p className="text-sm text-[#b55245]">{message}</p> : null}
        <p className="text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-forest">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
