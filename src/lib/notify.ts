import "server-only";
import type { Announcement, ClassSession, Rsvp, Subscriber } from "@prisma/client";
import { db } from "./db";
import { sendEmail } from "./email";
import { getSettings, siteUrl } from "./settings";
import { FORMATS, locationFor, whenText, type Viewer } from "./classes";

function memberLink(sub: Subscriber, next: string) {
  return `${siteUrl()}/m/${sub.token}?next=${encodeURIComponent(next)}`;
}

function classDetails(s: ClassSession, viewer: Viewer): string {
  const loc = locationFor(s, viewer);
  const lines = [`When: ${whenText(s)}`, `Format: ${FORMATS[s.format as keyof typeof FORMATS] ?? s.format}`];
  if (loc.venueName) lines.push(`Where: ${loc.venueName}`);
  if (loc.address) lines.push(`Address: ${loc.address}`);
  if (loc.directionsUrl) lines.push(`Directions: ${loc.directionsUrl}`);
  if (loc.meetingUrl) lines.push(`Join online: ${loc.meetingUrl}`);
  if (!loc.revealed && loc.lockedReason === "PRIVATE") lines.push("The address is shared privately with registered attendees.");
  return lines.join("\n");
}

async function activeSubscribers(kind: "reminders" | "announcements") {
  return db.subscriber.findMany({
    where: {
      confirmedAt: { not: null },
      unsubscribedAt: null,
      ...(kind === "reminders" ? { wantsReminders: true } : { wantsAnnouncements: true }),
    },
  });
}

export async function sendConfirmation(sub: Subscriber) {
  const settings = await getSettings();
  await sendEmail({
    to: sub.email,
    subject: `Please confirm your subscription to ${settings.siteName}`,
    text: `Hello${sub.name ? ` ${sub.name}` : ""},

Please confirm that you'd like to receive class reminders and updates from ${settings.siteName}:

${siteUrl()}/subscribe/confirm?token=${sub.token}

If you didn't ask for this, you can ignore this email.`,
  });
}

export type ClassChange = "NEW" | "UPDATED" | "RESCHEDULED" | "CANCELLED";

const CHANGE_SUBJECT: Record<ClassChange, string> = {
  NEW: "New class",
  UPDATED: "Class update",
  RESCHEDULED: "Class rescheduled",
  CANCELLED: "Class cancelled",
};

/** Emails subscribers (and approved attendees) about a change to a class. Returns the number of emails. */
export async function notifyClassChange(s: ClassSession, change: ClassChange): Promise<number> {
  const subject = `${CHANGE_SUBJECT[change]}: ${s.title}`;
  const intro =
    change === "CANCELLED"
      ? `The following class has been cancelled.`
      : change === "RESCHEDULED"
        ? `The following class has been moved to a new time.`
        : change === "NEW"
          ? `A new class has been added to the schedule.`
          : `There has been a change to the following class.`;
  const note = s.statusNote ? `\n\n${s.statusNote}` : "";

  const subs = await activeSubscribers("reminders");
  const sentTo = new Set<string>();
  for (const sub of subs) {
    sentTo.add(sub.email.toLowerCase());
    await sendEmail({
      to: sub.email,
      subject,
      text: `${intro}${note}\n\n${s.title}\n${classDetails(s, { isMember: true })}\n\nDetails: ${memberLink(sub, `/classes/${s.id}`)}`,
      unsubscribeToken: sub.token,
    });
  }

  const attendees = await db.rsvp.findMany({ where: { sessionId: s.id, status: "APPROVED" } });
  for (const r of attendees) {
    if (sentTo.has(r.email.toLowerCase())) continue;
    sentTo.add(r.email.toLowerCase());
    await sendEmail({
      to: r.email,
      subject,
      text: `${intro}${note}\n\n${s.title}\n${classDetails(s, { isApprovedAttendee: true })}\n\nDetails: ${siteUrl()}/classes/${s.id}`,
    });
  }
  return sentTo.size;
}

/** Sends one reminder per class, to subscribers and approved attendees, for classes starting soon. */
export async function sendDueReminders(now = new Date()): Promise<{ classes: number; emails: number }> {
  const hours = Number(process.env.REMINDER_HOURS_BEFORE || 24);
  const due = await db.classSession.findMany({
    where: {
      status: { in: ["PUBLISHED", "RESCHEDULED"] },
      reminderSentAt: null,
      startsAt: { gt: now, lte: new Date(now.getTime() + hours * 60 * 60 * 1000) },
    },
  });
  let emails = 0;
  for (const s of due) {
    // Claim the class first so overlapping cron runs don't double send.
    const claimed = await db.classSession.updateMany({ where: { id: s.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (!claimed.count) continue;
    const subs = await activeSubscribers("reminders");
    const sentTo = new Set<string>();
    for (const sub of subs) {
      sentTo.add(sub.email.toLowerCase());
      await sendEmail({
        to: sub.email,
        subject: `Reminder: ${s.title}`,
        text: `A reminder about the upcoming class.\n\n${s.title}\n${classDetails(s, { isMember: true })}\n\nDetails and calendar: ${memberLink(sub, `/classes/${s.id}`)}`,
        unsubscribeToken: sub.token,
      });
    }
    const attendees = await db.rsvp.findMany({ where: { sessionId: s.id, status: "APPROVED" } });
    for (const r of attendees) {
      if (sentTo.has(r.email.toLowerCase())) continue;
      sentTo.add(r.email.toLowerCase());
      await sendEmail({
        to: r.email,
        subject: `Reminder: ${s.title}`,
        text: `A reminder about the class you're attending.\n\n${s.title}\n${classDetails(s, { isApprovedAttendee: true })}`,
      });
    }
    emails += sentTo.size;
  }
  return { classes: due.length, emails };
}

export async function notifyAnnouncement(a: Announcement): Promise<number> {
  const subs = await activeSubscribers("announcements");
  for (const sub of subs) {
    await sendEmail({
      to: sub.email,
      subject: a.title,
      text: `${a.body}\n\nRead online: ${memberLink(sub, `/updates/${a.id}`)}`,
      unsubscribeToken: sub.token,
    });
  }
  await db.announcement.update({ where: { id: a.id }, data: { notifiedAt: new Date() } });
  return subs.length;
}

export async function sendRsvpApproved(r: Rsvp, s: ClassSession) {
  await sendEmail({
    to: r.email,
    subject: `You're registered: ${s.title}`,
    text: `Hello ${r.name},\n\nYou're registered for the class below. Please keep the address private.\n\n${s.title}\n${classDetails(s, { isApprovedAttendee: true })}`,
  });
}

export async function notifyAdminOfRsvp(r: Rsvp, s: ClassSession) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    subject: `New attendance request: ${s.title}`,
    text: `${r.name} (${r.email}) asked to attend ${s.title} on ${whenText(s)}.${r.note ? `\n\nNote: ${r.note}` : ""}\n\nReview: ${siteUrl()}/admin/rsvps`,
  });
}
