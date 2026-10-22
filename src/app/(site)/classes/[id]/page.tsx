import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FORMATS, VISIBLE_STATUSES, classEnd } from "@/lib/classes";
import { currentMember } from "@/lib/member";
import { isAdmin } from "@/lib/auth";
import { formatDate, formatTimeRange } from "@/lib/time";
import { CalendarLinks, LocationDetails, LockedNote, StatusBadge } from "@/components/ClassBits";
import { AttendForm } from "@/components/Forms";
import { ShareButton, WhatsAppShare } from "@/components/ShareButton";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const s = await db.classSession.findUnique({ where: { id } });
  if (!s) return null;
  if (!VISIBLE_STATUSES.includes(s.status) && !(await isAdmin())) return null;
  return s;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await load((await params).id);
  if (!s) return {};
  return { title: s.title, description: `${formatDate(s.startsAt, s.timezone)}, ${formatTimeRange(s.startsAt, s.endsAt, s.timezone)}` };
}

export default async function ClassPage({ params }: Props) {
  const s = await load((await params).id);
  if (!s) notFound();
  const [member, admin] = await Promise.all([currentMember(), isAdmin()]);
  const viewer = { isMember: !!member, isAdmin: admin };
  const ended = classEnd(s) < new Date();
  const cancelled = s.status === "CANCELLED";

  return (
    <article className="container narrow" style={{ padding: "clamp(40px, 7vw, 80px) var(--gutter)" }}>
      <Link href="/classes" className="small">← All classes</Link>
      <div style={{ display: "flex", gap: 8, margin: "20px 0 10px", flexWrap: "wrap" }}>
        <span className="badge badge-navy">{FORMATS[s.format as keyof typeof FORMATS]}</span>
        <StatusBadge status={s.status} />
        {ended && !cancelled && <span className="badge badge-muted">Past class</span>}
      </div>
      <h1 style={cancelled ? { textDecoration: "line-through", textDecorationColor: "var(--danger)" } : undefined}>{s.title}</h1>

      {s.statusNote && <div className={`notice ${cancelled ? "notice-error" : "notice-info"}`}>{s.statusNote}</div>}

      <div className="card" style={{ margin: "24px 0", display: "grid", gap: 20 }}>
        <ul className="meta-list">
          <li><span className="label">Date</span><span>{formatDate(s.startsAt, s.timezone)}</span></li>
          <li><span className="label">Time</span><span>{formatTimeRange(s.startsAt, s.endsAt, s.timezone)}</span></li>
          <LocationDetails session={s} viewer={viewer} />
        </ul>
        <LockedNote session={s} viewer={viewer} />
        {!ended && !cancelled && <CalendarLinks id={s.id} />}
      </div>

      {s.description && (
        <div className="prose"><p>{s.description}</p></div>
      )}

      <div className="btn-row" style={{ marginTop: 24 }}>
        <ShareButton path={`/classes/${s.id}`} title={s.title} />
        <WhatsAppShare path={`/classes/${s.id}`} title={s.title} />
      </div>

      {s.locationVisibility === "PRIVATE" && s.format !== "ONLINE" && !ended && !cancelled && !admin && (
        <section id="attend" className="card card-flat" style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: "1.7rem" }}>Ask to attend</h2>
          <p className="muted">This class meets at a private location. Send a request and the address will be emailed to you once it&apos;s confirmed.</p>
          <AttendForm sessionId={s.id} />
        </section>
      )}
    </article>
  );
}
