import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AnnouncementItem, CATEGORIES } from "@/components/AnnouncementItem";

export const metadata: Metadata = { title: "Updates" };

export default async function UpdatesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "" } = await searchParams;
  const valid = category in CATEGORIES ? category : "";
  const [settings, items] = await Promise.all([
    getSettings(),
    db.announcement.findMany({
      where: { published: true, publishedAt: { lte: new Date() }, ...(valid ? { category: valid } : {}) },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 60,
    }),
  ]);
  return (
    <>
      <header className="page-head">
        <div className="container">
          <span className="eyebrow">Updates</span>
          <h1>News &amp; announcements</h1>
          <p>Schedule changes, announcements and community news.</p>
        </div>
      </header>
      <section className="container narrow" style={{ paddingBottom: 80 }}>
        <nav className="chips" aria-label="Categories">
          <Link className="chip" href="/updates" aria-current={!valid}>All</Link>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <Link key={k} className="chip" href={`/updates?category=${k}`} aria-current={valid === k}>{v}</Link>
          ))}
        </nav>
        {items.length ? (
          <div className="grid">{items.map((a) => <AnnouncementItem key={a.id} a={a} timeZone={settings.timezone} />)}</div>
        ) : (
          <div className="card"><p style={{ margin: 0 }}>No updates yet.</p></div>
        )}
      </section>
    </>
  );
}
