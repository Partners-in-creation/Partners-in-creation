import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

// Confirmed subscribers are "members". Every email they receive carries a
// personal link (/m/<token>) that remembers them on this device, which is how
// subscriber-only class locations are unlocked without passwords.

const COOKIE = "pic_member";

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function rememberMember(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function forgetMember() {
  (await cookies()).delete(COOKIE);
}

export async function currentMember() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const sub = await db.subscriber.findUnique({ where: { token } });
  if (!sub || !sub.confirmedAt || sub.unsubscribedAt) return null;
  return sub;
}
