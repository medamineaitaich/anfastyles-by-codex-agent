"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WooCustomer } from "@/lib/woo/types";

function buildProfileForm(customer: WooCustomer) {
  return {
    first_name: customer.first_name,
    last_name: customer.last_name,
    billing: {
      phone: customer.billing.phone ?? "",
      address_1: customer.billing.address_1 ?? "",
      address_2: customer.billing.address_2 ?? "",
      city: customer.billing.city ?? "",
      state: customer.billing.state ?? "",
      postcode: customer.billing.postcode ?? "",
      country: customer.billing.country ?? "US",
    },
    shipping: {
      first_name: customer.shipping.first_name ?? "",
      last_name: customer.shipping.last_name ?? "",
      address_1: customer.shipping.address_1 ?? "",
      address_2: customer.shipping.address_2 ?? "",
      city: customer.shipping.city ?? "",
      state: customer.shipping.state ?? "",
      postcode: customer.shipping.postcode ?? "",
      country: customer.shipping.country ?? "US",
    },
  };
}

export function ProfileForm({ customer }: { customer: WooCustomer }) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildProfileForm(customer));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    setForm(buildProfileForm(customer));
  }, [customer]);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as {
      message?: string;
      customer?: WooCustomer;
    };
    setPending(false);
    setMessage(payload.message ?? (response.ok ? "Account updated." : "Unable to save changes."));

    if (!response.ok) {
      return;
    }

    if (payload.customer) {
      setForm(buildProfileForm(payload.customer));
    }

    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div className="card-surface p-6">
      <form className="grid gap-5" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            First Name
            <Input
              value={form.first_name}
              onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Last Name
            <Input
              value={form.last_name}
              onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Phone
          <Input
            value={form.billing.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                billing: { ...current.billing, phone: event.target.value },
              }))
            }
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Billing Address
            <Input
              value={form.billing.address_1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  billing: { ...current.billing, address_1: event.target.value },
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Shipping Address
            <Input
              value={form.shipping.address_1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  shipping: { ...current.shipping, address_1: event.target.value },
                }))
              }
            />
          </label>
        </div>
        <Button type="submit" disabled={pending || isRefreshing}>
          {pending || isRefreshing ? "Saving..." : "Save changes"}
        </Button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </form>
    </div>
  );
}
