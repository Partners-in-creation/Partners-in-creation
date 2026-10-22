import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings, isPlaceholder } from "@/lib/settings";
import { nextClass, upcomingClasses, FORMATS } from "@/lib/classes";
import { currentMember } from "@/lib/member";
import { isAdmin } from "@/lib/auth";
import { formatDate, formatTimeRange } from "@/lib/time";
import { CalendarLinks, ClassListItem, LocationDetails, LockedNote, StatusBadge } from "@/components/ClassBits";
import { RecordingItem } from "@/components/RecordingItem";
import { AnnouncementItem } from "@/components/AnnouncementItem";
import { QuickSubscribe } from "@/components/Forms";

export default async function HomePage() {
  const [settings, next, upcoming, recordings, updates, member, admin] = await Promise.all([
    getSettings(),
    nextClass(),
    upcomingClasses(4),
    db.recording.findMany({ where: { published: true }, orderBy: { recordedOn: "desc" }, take: 3 }),
    db.announcement.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
    currentMember(),
    isAdmin(),
  ]);
  const viewer = { isMember: !!member, isAdmin: admin };
  const later = upcoming.filter((s) => s.id !== next?.id).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container narrow">
          <span className="eyebrow reveal">{settings.tagline}</span>
          <h1 className="reveal reveal-2">{settings.siteName}</h1>
          <p className={`lead reveal reveal-3${isPlaceholder(settings.welcomeMessage) ? " placeholder-text" : ""}`}>
            {settings.welcomeMessage}
          </p>
          <div className="btn-row reveal reveal-3">
            <Link href="/classes" className="btn">Upcoming Classes</Link>
            <Link href="/recordings" className="btn btn-outline">Listen to Past Classes</Link>
          </div>
        </div>
      </section>

      <section className="section section-cream" id="next-class" aria-labelledby="next-heading">
        <div className="container">
          <span className="eyebrow">Next class</span>
          {next ? (
            <div className="card next-class">
              <div>
                <h2 id="next-heading" style={{ marginBottom: 8 }}>
                  <Link href={`/classes/${next.id}`} style={{ textDecoration: "none" }}>{next.title}</Link>
                </h2>
                <div className="date-block">{formatDate(next.startsAt, next.timezone)}</div>
                <div className="muted" style={{ fontSize: "1.1rem", marginBottom: 16 }}>
                  {formatTimeRange(next.startsAt, next.endsAt, next.timezone)}
                </div>
                {next.description && <p>{next.description}</p>}
                <CalendarLinks id={next.id} />
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <ul className="meta-list">
                  <li><span className="label">Format</span><span>{FORMATS[next.format as keyof typeof FORMATS]} <StatusBadge status={next.status} /></span></li>
                  <LocationDetails session={next} viewer={viewer} />
                </ul>
                {next.statusNote && <div className="notice notice-info" style={{ margin: 0 }}>{next.statusNote}</div>}
                <LockedNote session={next} viewer={viewer} />
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 id="next-heading">The schedule is being updated</h2>
              <p className="muted">{settings.scheduleSummary} Subscribe below to hear as soon as the next class is posted.</p>
            </div>
          )}
          {later.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div className="section-head">
                <h3 style={{ margin: 0 }}>Coming up</h3>
                <Link href="/classes" className="link-arrow">Full schedule</Link>
              </div>
              <div className="list">
                {later.map((s) => <ClassListItem key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="rec-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Recordings</span>
              <h2 id="rec-heading">Recent classes</h2>
            </div>
            <Link href="/recordings" className="link-arrow">All recordings</Link>
          </div>
          {recordings.length ? (
            <div className="grid grid-3">
              {recordings.map((r) => <RecordingItem key={r.id} rec={r} />)}
            </div>
          ) : (
            <p className="muted">Recordings of past classes will appear here.</p>
          )}
        </div>
      </section>

      <section className="section section-cream" aria-labelledby="updates-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Latest updates</span>
              <h2 id="updates-heading">News &amp; announcements</h2>
            </div>
            <Link href="/updates" className="link-arrow">All updates</Link>
          </div>
          {updates.length ? (
            <div className="grid grid-3">
              {updates.map((a) => <AnnouncementItem key={a.id} a={a} excerpt timeZone={settings.timezone} />)}
            </div>
          ) : (
            <p className="muted">Announcements and schedule changes will appear here.</p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="about-heading">
        <div className="container narrow center">
          <span className="eyebrow">About</span>
          <h2 id="about-heading">{settings.aboutTitle}</h2>
          <hr className="rule" />
          <div className={`prose${isPlaceholder(settings.aboutText) ? " placeholder-text" : ""}`}>
            <p>{settings.aboutText}</p>
          </div>
          <Link href="/about" className="link-arrow">More about the community</Link>
        </div>
      </section>

      <section className="section section-navy" aria-labelledby="sub-heading">
        <div className="container subscribe-band">
          <div>
            <span className="eyebrow">Stay connected</span>
            <h2 id="sub-heading">Never miss a class</h2>
            <p style={{ margin: 0 }}>Get a reminder before each class and hear about schedule changes and community news by email.</p>
          </div>
          <QuickSubscribe />
        </div>
      </section>
    </>
  );
}
