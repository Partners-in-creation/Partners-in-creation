import type { ClassSession } from "@prisma/client";
import { db } from "./db";
import { siteUrl } from "./settings";
import { formatDate, formatTimeRange } from "./time";
import type { CalendarEvent } from "./calendar";

export const FORMATS = { IN_PERSON: "In person", ONLINE: "Online", HYBRID: "In person & online" } as const;
export const STATUSES = { DRAFT: "Draft", PUBLISHED: "Published", RESCHEDULED: "Rescheduled", CANCELLED: "Cancelled" } as const;
export const VISIBILITY = {
  PUBLIC: "Public: anyone can see the address",
  SUBSCRIBERS: "Subscribers only: confirmed subscribers see the address",
  PRIVATE: "Private: shared individually with approved attendees",
} as const;

export type Viewer = { isAdmin?: boolean; isMember?: boolean; isApprovedAttendee?: boolean };

/** Statuses visitors can see. Drafts are admin only. */
export const VISIBLE_STATUSES = ["PUBLISHED", "RESCHEDULED", "CANCELLED"];

/** Classes stay listed as "upcoming" until they end (or 2 hours after start). */
export function classEnd(s: Pick<ClassSession, "startsAt" | "endsAt">): Date {
  return s.endsAt ?? new Date(s.startsAt.getTime() + 2 * 60 * 60 * 1000);
}

export function canSeeLocation(s: Pick<ClassSession, "locationVisibility">, viewer: Viewer): boolean {
  if (viewer.isAdmin || viewer.isApprovedAttendee) return true;
  if (s.locationVisibility === "PUBLIC") return true;
  if (s.locationVisibility === "SUBSCRIBERS") return !!viewer.isMember;
  return false;
}

export type LocationView = {
  hasPhysical: boolean;
  hasOnline: boolean;
  revealed: boolean;
  venueName: string;
  address: string;
  directionsUrl: string;
  meetingUrl: string;
  lockedReason: "" | "SUBSCRIBERS" | "PRIVATE";
};

/**
 * What a given viewer may see of a class's location. The venue name is always
 * shown; the street address, directions and meeting link follow the visibility setting.
 */
export function locationFor(s: ClassSession, viewer: Viewer): LocationView {
  const hasPhysical = s.format !== "ONLINE";
  const hasOnline = s.format !== "IN_PERSON";
  const revealed = canSeeLocation(s, viewer);
  return {
    hasPhysical,
    hasOnline,
    revealed,
    venueName: hasPhysical ? s.venueName : "",
    address: revealed && hasPhysical ? s.address : "",
    directionsUrl: revealed && hasPhysical ? s.directionsUrl : "",
    meetingUrl: revealed && hasOnline ? s.meetingUrl : "",
    lockedReason: revealed ? "" : (s.locationVisibility as "SUBSCRIBERS" | "PRIVATE"),
  };
}

export function locationText(loc: LocationView): string {
  const parts: string[] = [];
  if (loc.venueName) parts.push(loc.venueName);
  if (loc.address) parts.push(loc.address);
  if (loc.hasOnline && loc.meetingUrl) parts.push(`Online: ${loc.meetingUrl}`);
  else if (loc.hasOnline && !loc.hasPhysical) parts.push("Online");
  return parts.join(", ");
}

export function calendarEventFor(s: ClassSession, viewer: Viewer): CalendarEvent {
  const loc = locationFor(s, viewer);
  const url = `${siteUrl()}/classes/${s.id}`;
  let description = s.description;
  if (!loc.revealed) description += `${description ? "\n\n" : ""}Location details: ${url}`;
  return {
    uid: `${s.id}@partners-in-creation`,
    title: s.status === "CANCELLED" ? `Cancelled: ${s.title}` : s.title,
    description,
    location: locationText(loc),
    url,
    start: s.startsAt,
    end: classEnd(s),
    cancelled: s.status === "CANCELLED",
  };
}

export function whenText(s: ClassSession): string {
  return `${formatDate(s.startsAt, s.timezone)}, ${formatTimeRange(s.startsAt, s.endsAt, s.timezone)}`;
}

export async function upcomingClasses(limit = 50) {
  const now = new Date();
  const rows = await db.classSession.findMany({
    where: { status: { in: VISIBLE_STATUSES }, startsAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) } },
    orderBy: { startsAt: "asc" },
    take: limit + 10,
  });
  return rows.filter((s) => classEnd(s) > now).slice(0, limit);
}

/** The next class that is actually going ahead. */
export async function nextClass() {
  const list = await upcomingClasses(10);
  return list.find((s) => s.status !== "CANCELLED") ?? null;
}

export async function pastClasses(limit = 30) {
  return db.classSession.findMany({
    where: { status: { in: ["PUBLISHED", "RESCHEDULED"] }, startsAt: { lt: new Date() } },
    orderBy: { startsAt: "desc" },
    take: limit,
  });
}
