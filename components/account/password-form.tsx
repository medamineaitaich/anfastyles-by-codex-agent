"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const payload = (await response.json()) as { message?: string };
    setPending(false);
    setMessage(payload.message ?? (response.ok ? "Password updated." : "Unable to update password."));

    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div className="card-surface p-6">
      <div className="grid gap-5">
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
        <Button type="button" disabled={pending} onClick={submit}>
          {pending ? "Updating..." : "Change password"}
        </Button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </div>
  );
}
