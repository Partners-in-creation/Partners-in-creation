import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { pastClasses, upcomingClasses } from "@/lib/classes";
import { ClassListItem } from "@/components/ClassBits";

export const metadata: Metadata = { title: "Classes & Schedule" };

export default async function ClassesPage() {
  const [settings, upcoming, past] = await Promise.all([getSettings(), upcomingClasses(40), pastClasses(12)]);
  const nextId = upcoming.find((s) => s.status !== "CANCELLED")?.id;

  return (
    <>
      <header className="page-head">
        <div className="container">
          <span className="eyebrow">Classes</span>
          <h1>Classes &amp; schedule</h1>
          <p>{settings.scheduleSummary} Times are shown in each class&apos;s local time zone.</p>
          {nextId && <Link href={`/classes/${nextId}`} className="btn">See the next class</Link>}
        </div>
      </header>

      <section className="container" style={{ paddingBottom: 64 }} aria-labelledby="upcoming">
        <h2 id="upcoming" className="sr-only">Upcoming classes</h2>
        {upcoming.length ? (
          <div className="list">
            {upcoming.map((s) => (
              <div key={s.id} style={s.id === nextId ? { background: "var(--cream)", margin: "0 calc(var(--gutter) * -1)", padding: "0 var(--gutter)" } : undefined}>
                {s.id === nextId && <span className="eyebrow" style={{ margin: "18px 0 -10px" }}>Next class</span>}
                <ClassListItem session={s} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p style={{ margin: 0 }}>No upcoming classes are posted right now. <Link href="/subscribe">Subscribe</Link> to hear when the schedule is updated.</p>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="section section-cream" aria-labelledby="past">
          <div className="container">
            <div className="section-head">
              <h2 id="past">Past classes</h2>
              <Link href="/recordings" className="link-arrow">Listen to recordings</Link>
            </div>
            <div className="list">
              {past.map((s) => <ClassListItem key={s.id} session={s} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
