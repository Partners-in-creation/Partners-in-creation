import type { ClassSeries } from "@prisma/client";
import { db } from "./db";
import { addDays, utcToZonedInputs, weekdayOf, zonedToUtc } from "./time";

export function seriesDays(series: Pick<ClassSeries, "daysOfWeek">): number[] {
  return series.daysOfWeek
    .split(",")
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

function sessionFields(series: ClassSeries, startsAt: Date, endsAt: Date | null) {
  return {
    title: series.title,
    description: series.description,
    startsAt,
    endsAt,
    timezone: series.timezone,
    format: series.format,
    venueName: series.venueName,
    address: series.address,
    directionsUrl: series.directionsUrl,
    meetingUrl: series.meetingUrl,
    locationVisibility: series.locationVisibility,
  };
}

function timesOn(series: ClassSeries, date: string) {
  const startsAt = zonedToUtc(date, series.startTime, series.timezone);
  let endsAt: Date | null = series.endTime ? zonedToUtc(date, series.endTime, series.timezone) : null;
  if (endsAt && endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  return { startsAt, endsAt };
}

/**
 * Creates sessions for each matching weekday from `fromDate` for `weeks` weeks.
 * Dates that already have a session from this series (even edited, cancelled
 * or drafted ones) are left alone. Returns the number created.
 */
export async function generateSessions(series: ClassSeries, fromDate: string, weeks: number): Promise<number> {
  const days = seriesDays(series);
  // Dates (in the series time zone) that already have a session from this series.
  const existing = await db.classSession.findMany({ where: { seriesId: series.id }, select: { originalStartsAt: true, startsAt: true } });
  const taken = new Set(existing.map((s) => utcToZonedInputs(s.originalStartsAt ?? s.startsAt, series.timezone).date));
  let created = 0;
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(fromDate, i);
    if (!days.includes(weekdayOf(date))) continue;
    const { startsAt, endsAt } = timesOn(series, date);
    if (startsAt < new Date() || taken.has(date)) continue;
    await db.classSession.create({
      data: { ...sessionFields(series, startsAt, endsAt), seriesId: series.id, originalStartsAt: startsAt, status: "PUBLISHED" },
    });
    created++;
  }
  return created;
}

/** Copies series details onto its future sessions that were never edited individually. */
export async function applySeriesToFuture(series: ClassSeries): Promise<number> {
  const future = await db.classSession.findMany({
    where: { seriesId: series.id, edited: false, startsAt: { gt: new Date() } },
  });
  let updated = 0;
  for (const s of future) {
    // Keep each session on its own date, with the series' (possibly new) time.
    const date = utcToZonedInputs(s.originalStartsAt ?? s.startsAt, series.timezone).date;
    if (!seriesDays(series).includes(weekdayOf(date))) {
      // The weekday was removed from the series: hide the session rather than delete it.
      await db.classSession.update({ where: { id: s.id }, data: { status: "DRAFT" } });
      updated++;
      continue;
    }
    const { startsAt, endsAt } = timesOn(series, date);
    await db.classSession.update({
      where: { id: s.id },
      data: { ...sessionFields(series, startsAt, endsAt), originalStartsAt: startsAt, reminderSentAt: null },
    });
    updated++;
  }
  return updated;
}

export function todayIn(timeZone: string): string {
  return utcToZonedInputs(new Date(), timeZone).date;
}
