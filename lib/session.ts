import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { WooCustomer } from "@/lib/woo/types";

export type SessionPayload = {
  customerId: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
};

const SESSION_COOKIE = "anfastyles-session";
const CUSTOMER_HINT_COOKIE = "anfastyles-customer-hint";
const PROFILE_SNAPSHOT_COOKIE = "anfastyles-profile-snapshot";

export type ProfileSnapshot = Pick<
  WooCustomer,
  "id" | "email" | "username" | "first_name" | "last_name" | "billing" | "shipping"
>;

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }

  return new TextEncoder().encode(secret);
}

export async createSession(payload: SessionPayload) {
  const token = await createToken(payload, "7d");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function createToken(payload: object, expirationTime: string) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSecret());
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<SessionPayload>(token, getSecret());
    return verified.payload;
  } catch {
    return null;
  }
}

export async function saveCustomerHint(payload: SessionPayload) {
  const token = await createToken(payload, "30d");
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_HINT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCustomerHint() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_HINT_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<SessionPayload>(token, getSecret());
    return verified.payload;
  } catch {
    return null;
  }
}

export async function saveProfileSnapshot(customer: ProfileSnapshot) {
  const token = await createToken(customer, "12h");
  const cookieStore = await cookies();

  cookieStore.set(PROFILE_SNAPSHOT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getProfileSnapshot(customerId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PROFILE_SNAPSHOT_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<ProfileSnapshot>(token, getSecret());
    return verified.payload.id === customerId ? verified.payload : null;
  } catch {
    return null;
  }
}
