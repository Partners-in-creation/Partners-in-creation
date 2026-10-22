import { cache } from "react";
import { db } from "./db";

export const getSettings = cache(async () => {
  const existing = await db.siteSettings.findUnique({ where: { id: 1 } });
  return existing ?? db.siteSettings.create({ data: { id: 1 } });
});

export type Settings = Awaited<ReturnType<typeof getSettings>>;

/** Text that still starts with "[Placeholder]" has not been written by the admin yet. */
export function isPlaceholder(text: string): boolean {
  return text.trim().startsWith("[Placeholder]");
}

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
