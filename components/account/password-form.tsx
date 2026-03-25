"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setMessage(null);
    setMessageTone(null);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const payload = (await response.json()) as { message?: string };
    setPending(false);
    setMessage(payload.message ?? (response.ok ? "Password updated." : "Unable to update password."));
    setMessageTone(response.ok ? "success" : "error");

    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div className="card-surface p-6">
      <form className="grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Current Password
          <Input
            value={currentPassword}
            type="password"
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          New Password
          <Input
            value={newPassword}
            type="password"
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Updating..." : "Change password"}
        </Button>
        {message ? (
          <p
            className={
              messageTone === "success"
                ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
                : "rounded-2xl border border-[#e7b0a8] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#8a2f24]"
            }
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
