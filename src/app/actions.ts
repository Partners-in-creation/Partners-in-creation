"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { newToken } from "@/lib/member";
import { notifyAdminOfRsvp, sendConfirmation } from "@/lib/notify";
import { rateLimited } from "@/lib/rate-limit";

export type FormState = { ok?: boolean; message?: string; error?: string };

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  name: z.string().trim().max(100).optional().default(""),
});

export async function subscribe(_prev: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "Thank you." }; // honeypot
  if (rateLimited(await clientKey("subscribe"))) return { error: "Too many attempts. Please try again later." };

  const parsed = subscribeSchema.safeParse({ email: form.get("email"), name: form.get("name") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, name } = parsed.data;
  // Forms that show the preference boxes send "prefs"; the short form subscribes to everything.
  const hasPrefs = form.get("prefs") === "1";
  const wantsReminders = hasPrefs ? form.get("reminders") === "on" : true;
  const wantsAnnouncements = hasPrefs ? form.get("announcements") === "on" : true;
  if (!wantsReminders && !wantsAnnouncements) return { error: "Please choose at least one kind of email." };

  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing && existing.confirmedAt && !existing.unsubscribedAt) {
    // Don't let anyone change another person's settings by typing their email.
    return { ok: true, message: "You're already subscribed. To change what you receive, use the link at the bottom of any of our emails." };
  }
  const sub = existing
    ? await db.subscriber.update({
        where: { id: existing.id },
        data: { name: name || existing.name, wantsReminders, wantsAnnouncements, unsubscribedAt: null, confirmedAt: null },
      })
    : await db.subscriber.create({ data: { email, name, token: newToken(), wantsReminders, wantsAnnouncements } });
  await sendConfirmation(sub);
  return { ok: true, message: "Almost done. Please check your email and click the confirmation link." };
}

const prefsSchema = z.object({ token: z.string().min(10), name: z.string().trim().max(100) });

export async function updatePreferences(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = prefsSchema.safeParse({ token: form.get("token"), name: form.get("name") ?? "" });
  if (!parsed.success) return { error: "This link is not valid." };
  const sub = await db.subscriber.findUnique({ where: { token: parsed.data.token } });
  if (!sub) return { error: "This link is not valid." };
  const wantsReminders = form.get("reminders") === "on";
  const wantsAnnouncements = form.get("announcements") === "on";
  await db.subscriber.update({
    where: { id: sub.id },
    data: {
      name: parsed.data.name,
      wantsReminders,
      wantsAnnouncements,
      unsubscribedAt: wantsReminders || wantsAnnouncements ? null : new Date(),
    },
  });
  return { ok: true, message: wantsReminders || wantsAnnouncements ? "Your preferences are saved." : "You've been unsubscribed from all emails." };
}

const rsvpSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  note: z.string().trim().max(500).optional().default(""),
});

export async function requestToAttend(_prev: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "Thank you." };
  if (rateLimited(await clientKey("rsvp"))) return { error: "Too many attempts. Please try again later." };
  const parsed = rsvpSchema.safeParse({
    sessionId: form.get("sessionId"),
    name: form.get("name"),
    email: form.get("email"),
    note: form.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { sessionId, name, email, note } = parsed.data;

  const session = await db.classSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status === "DRAFT" || session.status === "CANCELLED") return { error: "This class is not open for requests." };

  const existing = await db.rsvp.findUnique({ where: { sessionId_email: { sessionId, email } } });
  if (existing) return { ok: true, message: "We already have your request. You'll hear back by email." };
  const rsvp = await db.rsvp.create({ data: { sessionId, name, email, note } });
  await notifyAdminOfRsvp(rsvp, session);
  return { ok: true, message: "Thank you. Your request has been sent, and the details will come to you by email." };
}
