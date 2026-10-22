import Link from "next/link";
import { db } from "@/lib/db";
import { nextClass } from "@/lib/classes";
import { getSettings, isPlaceholder } from "@/lib/settings";
import { emailConfigured } from "@/lib/email";
import { storageDriver } from "@/lib/storage";
import { formatDate, formatTimeRange } from "@/lib/time";

export default async function AdminHome() {
  const [settings, next, subs, recs, pending, upcomingCount] = await Promise.all([
    getSettings(),
    nextClass(),
    db.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
    db.recording.count(),
    db.rsvp.count({ where: { status: "PENDING", session: { startsAt: { gt: new Date() } } } }),
    db.classSession.count({ where: { startsAt: { gt: new Date() }, status: { in: ["PUBLISHED", "RESCHEDULED"] } } }),
  ]);
  const placeholders = [settings.welcomeMessage, settings.aboutText, settings.communityText].filter(isPlaceholder).length;
  const setup: string[] = [];
  if (!emailConfigured()) setup.push("Email sending isn't set up yet, so emails are only saved under Sent emails. Add SMTP_URL and EMAIL_FROM (an address dedicated to this site).");
  if (settings.contactEmail === "contact@example.com") setup.push("The contact email is still the placeholder contact@example.com. Update it in Site settings.");
  if (placeholders) setup.push(`${placeholders} text section${placeholders > 1 ? "s" : ""} still show placeholder copy. Edit them in Site settings.`);
  if (!process.env.CRON_SECRET) setup.push("Automatic class reminders need CRON_SECRET and a scheduler calling /api/cron/reminders.");

  return (
    <>
      <div className="admin-top">
        <h1>Welcome back</h1>
        <div className="btn-row">
          <Link href="/admin/classes/new" className="btn btn-sm">New class</Link>
          <Link href="/admin/recordings/new" className="btn btn-outline btn-sm">Add recording</Link>
          <Link href="/admin/announcements/new" className="btn btn-outline btn-sm">Post update</Link>
        </div>
      </div>

      {setup.length > 0 && (
        <div className="notice notice-info">
          <b>Finish setting up</b>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>{setup.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat"><b>{upcomingCount}</b><span>Upcoming classes</span></div>
        <div className="stat"><b>{recs}</b><span>Recordings</span></div>
        <div className="stat"><b>{subs}</b><span>Subscribers</span></div>
        <Link href="/admin/rsvps" className="stat" style={{ textDecoration: "none" }}><b>{pending}</b><span>Attendance requests waiting</span></Link>
      </div>

      <div className="card">
        <span className="eyebrow">Next class</span>
        {next ? (
          <>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 4 }}>{next.title}</h2>
            <p className="muted">{formatDate(next.startsAt, next.timezone)} · {formatTimeRange(next.startsAt, next.endsAt, next.timezone)}</p>
            <div className="btn-row">
              <Link href={`/admin/classes/${next.id}`} className="btn btn-sm">Edit or cancel</Link>
              <Link href={`/classes/${next.id}`} className="btn btn-quiet btn-sm" target="_blank">View on site</Link>
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No upcoming classes. <Link href="/admin/classes">Set up the weekly schedule</Link>.</p>
        )}
      </div>
      <p className="small muted" style={{ marginTop: 20 }}>Audio storage: {storageDriver() === "s3" ? "cloud storage (S3-compatible)" : "server disk"}.</p>
    </>
  );
}
