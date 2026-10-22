"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkPassword, endAdminSession, requireAdmin, startAdminSession } from "@/lib/auth";
import { rateLimited } from "@/lib/rate-limit";
import { isValidTimeZone, zonedToUtc } from "@/lib/time";
import { applySeriesToFuture, generateSessions, todayIn } from "@/lib/series";
import { notifyAnnouncement, notifyClassChange, sendConfirmation, sendRsvpApproved, type ClassChange } from "@/lib/notify";
import { slugify } from "@/lib/slug";
import { deleteStoredFile, isValidKey } from "@/lib/storage";
import { newToken } from "@/lib/member";
import { getSettings } from "@/lib/settings";
import { headers } from "next/headers";

export type AdminState = { error?: string; message?: string };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";

function firstIssue(e: z.ZodError) {
  const i = e.issues[0];
  return `${i.path.join(".") ? `${i.path.join(".")}: ` : ""}${i.message}`;
}

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "must start with https://");

// ---------- Login ----------

export async function login(_prev: AdminState, form: FormData): Promise<AdminState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(`login:${ip}`, 8, 15 * 60 * 1000)) return { error: "Too many attempts. Please wait 15 minutes." };
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD is not set on the server yet." };
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "That password isn't right." };
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

// ---------- Classes ----------

const locationSchema = {
  format: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  venueName: z.string().trim().max(200),
  address: z.string().trim().max(500),
  directionsUrl: optionalUrl,
  meetingUrl: optionalUrl,
  locationVisibility: z.enum(["PUBLIC", "SUBSCRIBERS", "PRIVATE"]),
};

const timeRe = /^\d{2}:\d{2}$/;

const classSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  startTime: z.string().regex(timeRe, "Start time is required"),
  endTime: z.string().refine((v) => v === "" || timeRe.test(v), "Invalid end time"),
  timezone: z.string().refine(isValidTimeZone, "Unknown time zone"),
  status: z.enum(["DRAFT", "PUBLISHED", "RESCHEDULED", "CANCELLED"]),
  statusNote: z.string().trim().max(500),
  ...locationSchema,
});

function readClass(form: FormData) {
  return classSchema.safeParse({
    title: str(form, "title"),
    description: str(form, "description"),
    date: str(form, "date"),
    startTime: str(form, "startTime"),
    endTime: str(form, "endTime"),
    timezone: str(form, "timezone"),
    status: str(form, "status"),
    statusNote: str(form, "statusNote"),
    format: str(form, "format"),
    venueName: str(form, "venueName"),
    address: str(form, "address"),
    directionsUrl: str(form, "directionsUrl"),
    meetingUrl: str(form, "meetingUrl"),
    locationVisibility: str(form, "locationVisibility"),
  });
}

function classTimes(d: { date: string; startTime: string; endTime: string; timezone: string }) {
  const startsAt = zonedToUtc(d.date, d.startTime, d.timezone);
  let endsAt = d.endTime ? zonedToUtc(d.date, d.endTime, d.timezone) : null;
  if (endsAt && endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  return { startsAt, endsAt };
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

export async function saveClass(_prev: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = readClass(form);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { date, startTime, endTime, ...d } = parsed.data;
  const { startsAt, endsAt } = classTimes({ date, startTime, endTime, timezone: d.timezone });
  const notify = bool(form, "notify");
  const id = str(form, "id");

  let sessionId: string;
  let change: ClassChange | null = null;

  if (!id) {
    const created = await db.classSession.create({ data: { ...d, startsAt, endsAt, originalStartsAt: startsAt } });
    sessionId = created.id;
    if (d.status !== "DRAFT") change = "NEW";
  } else {
    const before = await db.classSession.findUnique({ where: { id } });
    if (!before) return { error: "Class not found." };
    const timeChanged = before.startsAt.getTime() !== startsAt.getTime() || (before.endsAt?.getTime() ?? 0) !== (endsAt?.getTime() ?? 0);
    let status = d.status;
    // Moving a published class marks it as rescheduled so visitors notice.
    if (timeChanged && before.status === "PUBLISHED" && status === "PUBLISHED" && before.startsAt.getTime() !== startsAt.getTime()) {
      status = "RESCHEDULED";
    }
    const after = await db.classSession.update({
      where: { id },
      data: { ...d, status, startsAt, endsAt, edited: true, ...(timeChanged ? { reminderSentAt: null } : {}) },
    });
    sessionId = after.id;
    if (status === "CANCELLED" && before.status !== "CANCELLED") change = "CANCELLED";
    else if (status !== "DRAFT" && status !== "CANCELLED" && before.status === "DRAFT") change = "NEW";
    else if (status === "RESCHEDULED" && timeChanged) change = "RESCHEDULED";
    else if (status !== "DRAFT" && status !== "CANCELLED") change = "UPDATED";
  }

  let sent = 0;
  if (notify && change) {
    const s = await db.classSession.findUniqueOrThrow({ where: { id: sessionId } });
    sent = await notifyClassChange(s, change);
  }
  revalidateSite();
  redirect(`/admin/classes?saved=${notify && change ? `notified-${sent}` : "1"}`);
}

export async function deleteClass(form: FormData) {
  await requireAdmin();
  await db.classSession.delete({ where: { id: str(form, "id") } });
  revalidateSite();
  redirect("/admin/classes?saved=deleted");
}

export async function quickStatus(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const status = str(form, "status");
  if (!["PUBLISHED", "CANCELLED", "DRAFT"].includes(status)) return;
  const before = await db.classSession.findUnique({ where: { id } });
  if (!before) return;
  const s = await db.classSession.update({ where: { id }, data: { status, edited: true } });
  if (bool(form, "notify") && status === "CANCELLED" && before.status !== "CANCELLED") await notifyClassChange(s, "CANCELLED");
  revalidateSite();
}

// ---------- Series ----------

const seriesSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000),
  days: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Pick at least one day"),
  startTime: z.string().regex(timeRe, "Start time is required"),
  endTime: z.string().refine((v) => v === "" || timeRe.test(v), "Invalid end time"),
  timezone: z.string().refine(isValidTimeZone, "Unknown time zone"),
  active: z.boolean(),
  ...locationSchema,
});

export async function saveSeries(_prev: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = seriesSchema.safeParse({
    title: str(form, "title"),
    description: str(form, "description"),
    days: form.getAll("days").map(String),
    startTime: str(form, "startTime"),
    endTime: str(form, "endTime"),
    timezone: str(form, "timezone"),
    active: bool(form, "active"),
    format: str(form, "format"),
    venueName: str(form, "venueName"),
    address: str(form, "address"),
    directionsUrl: str(form, "directionsUrl"),
    meetingUrl: str(form, "meetingUrl"),
    locationVisibility: str(form, "locationVisibility"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { days, endTime, ...rest } = parsed.data;
  const data = { ...rest, endTime: endTime || null, daysOfWeek: [...new Set(days)].sort().join(",") };
  const weeks = Math.min(52, Math.max(0, Number(str(form, "weeks")) || 0));
  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(str(form, "fromDate")) ? str(form, "fromDate") : todayIn(data.timezone);

  const id = str(form, "id");
  const series = id ? await db.classSeries.update({ where: { id }, data }) : await db.classSeries.create({ data });
  let updated = 0;
  if (id && bool(form, "applyFuture")) updated = await applySeriesToFuture(series);
  const created = series.active && weeks > 0 ? await generateSessions(series, fromDate, weeks) : 0;
  revalidateSite();
  redirect(`/admin/series/${series.id}?created=${created}&updated=${updated}`);
}

export async function deleteSeries(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (bool(form, "removeFuture")) {
    await db.classSession.deleteMany({ where: { seriesId: id, startsAt: { gt: new Date() } } });
  }
  await db.classSeries.delete({ where: { id } });
  revalidateSite();
  redirect("/admin/classes?saved=series-deleted");
}

// ---------- Recordings ----------

const recordingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(90),
  description: z.string().trim().max(10000),
  topic: z.string().trim().max(80),
  recordedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  storageKey: z.string().trim().refine((v) => v === "" || isValidKey(v), "Invalid uploaded file"),
  externalUrl: optionalUrl,
  mimeType: z.string().trim().max(100),
  sizeBytes: z.string(),
  durationSec: z.string(),
  published: z.boolean(),
});

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const hit = await db.recording.findUnique({ where: { slug } });
    if (!hit || hit.id === exceptId) return slug;
    slug = `${slugify(base).slice(0, 74)}-${i}`;
  }
}

export async function saveRecording(_prev: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = recordingSchema.safeParse({
    title: str(form, "title"),
    slug: str(form, "slug"),
    description: str(form, "description"),
    topic: str(form, "topic"),
    recordedOn: str(form, "recordedOn"),
    storageKey: str(form, "storageKey"),
    externalUrl: str(form, "externalUrl"),
    mimeType: str(form, "mimeType"),
    sizeBytes: str(form, "sizeBytes"),
    durationSec: str(form, "durationSec"),
    published: bool(form, "published"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  if (!d.storageKey && !d.externalUrl) return { error: "Upload an audio file or paste a link to one." };

  const id = str(form, "id") || undefined;
  const before = id ? await db.recording.findUnique({ where: { id } }) : null;
  const data = {
    title: d.title,
    slug: await uniqueSlug(d.slug || d.title, id),
    description: d.description,
    topic: d.topic,
    recordedOn: new Date(`${d.recordedOn}T00:00:00Z`),
    storageKey: d.storageKey || null,
    externalUrl: d.storageKey ? null : d.externalUrl || null,
    mimeType: d.mimeType,
    sizeBytes: Number(d.sizeBytes) || null,
    durationSec: Math.round(Number(d.durationSec)) || null,
    published: d.published,
  };
  const rec = id ? await db.recording.update({ where: { id }, data }) : await db.recording.create({ data });
  if (before?.storageKey && before.storageKey !== rec.storageKey) await deleteStoredFile(before.storageKey);
  revalidateSite();
  redirect(`/admin/recordings?saved=1`);
}

export async function deleteRecording(form: FormData) {
  await requireAdmin();
  const rec = await db.recording.delete({ where: { id: str(form, "id") } });
  if (rec.storageKey) await deleteStoredFile(rec.storageKey);
  revalidateSite();
  redirect("/admin/recordings?saved=deleted");
}

// ---------- Announcements ----------

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Write the announcement").max(20000),
  category: z.enum(["ANNOUNCEMENT", "SCHEDULE", "COMMUNITY"]),
  pinned: z.boolean(),
  published: z.boolean(),
});

export async function saveAnnouncement(_prev: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = announcementSchema.safeParse({
    title: str(form, "title"),
    body: str(form, "body"),
    category: str(form, "category"),
    pinned: bool(form, "pinned"),
    published: bool(form, "published"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const id = str(form, "id");
  const before = id ? await db.announcement.findUnique({ where: { id } }) : null;
  const publishedAt = parsed.data.published && before && !before.published ? new Date() : undefined;
  const a = id
    ? await db.announcement.update({ where: { id }, data: { ...parsed.data, ...(publishedAt ? { publishedAt } : {}) } })
    : await db.announcement.create({ data: parsed.data });
  let sent = -1;
  if (bool(form, "notify") && a.published) sent = await notifyAnnouncement(a);
  revalidateSite();
  redirect(`/admin/announcements?saved=${sent >= 0 ? `notified-${sent}` : "1"}`);
}

export async function deleteAnnouncement(form: FormData) {
  await requireAdmin();
  await db.announcement.delete({ where: { id: str(form, "id") } });
  revalidateSite();
  redirect("/admin/announcements?saved=deleted");
}

// ---------- Subscribers & attendees ----------

export async function inviteSubscriber(_prev: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const email = z.string().trim().toLowerCase().email().safeParse(str(form, "email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const name = str(form, "name").slice(0, 100);
  const existing = await db.subscriber.findUnique({ where: { email: email.data } });
  if (existing?.confirmedAt && !existing.unsubscribedAt) return { message: `${email.data} is already subscribed.` };
  if (existing?.unsubscribedAt) return { error: `${email.data} unsubscribed earlier, so they need to subscribe again themselves.` };
  const sub = existing ?? (await db.subscriber.create({ data: { email: email.data, name, token: newToken() } }));
  await sendConfirmation(sub);
  revalidatePath("/admin/subscribers");
  return { message: `Invitation sent to ${email.data}. They'll be added once they confirm.` };
}

export async function removeSubscriber(form: FormData) {
  await requireAdmin();
  await db.subscriber.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/subscribers");
}

export async function decideRsvp(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const decision = str(form, "decision");
  if (decision !== "APPROVED" && decision !== "DECLINED") return;
  const r = await db.rsvp.update({ where: { id }, data: { status: decision }, include: { session: true } });
  if (decision === "APPROVED") {
    await sendRsvpApproved(r, r.session);
    await db.rsvp.update({ where: { id }, data: { sharedAt: new Date() } });
  }
  revalidatePath("/admin/rsvps");
  revalidatePath("/admin");
}

// ---------- Settings ----------

const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  tagline: z.string().trim().max(200),
  welcomeMessage: z.string().trim().max(1000),
  aboutTitle: z.string().trim().max(120),
  aboutText: z.string().trim().max(10000),
  aboutPhotoUrl: optionalUrl,
  communityText: z.string().trim().max(10000),
  scheduleSummary: z.string().trim().max(300),
  contactEmail: z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, "Invalid contact email"),
  contactPhone: z.string().trim().max(40),
  whatsappUrl: optionalUrl,
  timezone: z.string().refine(isValidTimeZone, "Unknown time zone"),
});

export async function saveSettings(_prev: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const raw = Object.fromEntries(Object.keys(settingsSchema.shape).map((k) => [k, str(form, k)]));
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await getSettings();
  await db.siteSettings.update({ where: { id: 1 }, data: parsed.data });
  revalidateSite();
  return { message: "Settings saved." };
}
