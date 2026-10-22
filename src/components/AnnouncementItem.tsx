import Link from "next/link";
import type { Announcement } from "@prisma/client";

export const CATEGORIES = { ANNOUNCEMENT: "Announcement", SCHEDULE: "Schedule change", COMMUNITY: "Community news" } as const;

export function announcementDate(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "long", day: "numeric", year: "numeric" }).format(d);
}

export function AnnouncementItem({ a, excerpt = false, timeZone = "UTC" }: { a: Announcement; excerpt?: boolean; timeZone?: string }) {
  const body = excerpt && a.body.length > 220 ? `${a.body.slice(0, 220).trimEnd()}…` : a.body;
  return (
    <article className="card card-flat">
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <span className={`badge${a.category === "SCHEDULE" ? " badge-navy" : ""}`}>
          {CATEGORIES[a.category as keyof typeof CATEGORIES] ?? a.category}
        </span>
        {a.pinned && <span className="badge badge-muted">Pinned</span>}
        <span className="small muted">{announcementDate(a.publishedAt, timeZone)}</span>
      </div>
      <h3 style={{ marginBottom: 8 }}>
        <Link href={`/updates/${a.id}`} style={{ textDecoration: "none" }}>{a.title}</Link>
      </h3>
      <div className="prose" style={{ fontSize: "1rem" }}><p style={{ marginBottom: 0 }}>{body}</p></div>
    </article>
  );
}
