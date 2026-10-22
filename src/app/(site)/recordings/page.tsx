import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { RecordingItem } from "@/components/RecordingItem";

export const metadata: Metadata = { title: "Recordings" };

const PAGE_SIZE = 18;

type Props = { searchParams: Promise<{ q?: string; topic?: string; year?: string; page?: string }> };

export default async function RecordingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const topic = (sp.topic ?? "").trim();
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : null;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.RecordingWhereInput = { published: true };
  if (topic) where.topic = topic;
  if (year) where.recordedOn = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };

  const [all, topics, years] = await Promise.all([
    db.recording.findMany({ where, orderBy: { recordedOn: "desc" } }),
    db.recording.findMany({ where: { published: true, topic: { not: "" } }, distinct: ["topic"], select: { topic: true }, orderBy: { topic: "asc" } }),
    db.recording.findMany({ where: { published: true }, select: { recordedOn: true } }),
  ]);
  const yearList = [...new Set(years.map((r) => r.recordedOn.getUTCFullYear()))].sort((a, b) => b - a);

  // Keyword search runs here so it is case-insensitive on every database.
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = terms.length
    ? all.filter((r) => {
        const hay = `${r.title} ${r.description} ${r.topic}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
    : all;
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const link = (over: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const merged = { q, topic, year: year ?? "", page: "", ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const s = p.toString();
    return `/recordings${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <header className="page-head">
        <div className="container">
          <span className="eyebrow">Library</span>
          <h1>Torah recordings</h1>
          <p>Listen to past classes, newest first. Search by title or keyword, or browse by topic.</p>
        </div>
      </header>
      <section className="container" style={{ paddingBottom: 80 }}>
        <form className="filters" role="search" action="/recordings">
          <label className="sr-only" htmlFor="rq">Search recordings</label>
          <input id="rq" type="search" name="q" defaultValue={q} placeholder="Search by title or keyword" />
          <label className="sr-only" htmlFor="rt">Topic</label>
          <select id="rt" name="topic" defaultValue={topic}>
            <option value="">All topics</option>
            {topics.map((t) => <option key={t.topic} value={t.topic}>{t.topic}</option>)}
          </select>
          <label className="sr-only" htmlFor="ry">Year</label>
          <select id="ry" name="year" defaultValue={year ?? ""}>
            <option value="">Any date</option>
            {yearList.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn">Search</button>
        </form>

        {topics.length > 0 && (
          <nav className="chips" aria-label="Topics">
            <Link className="chip" href={link({ topic: "" })} aria-current={!topic}>All</Link>
            {topics.map((t) => (
              <Link key={t.topic} className="chip" href={link({ topic: t.topic })} aria-current={topic === t.topic}>{t.topic}</Link>
            ))}
          </nav>
        )}

        <p className="small muted" aria-live="polite">
          {matches.length} {matches.length === 1 ? "recording" : "recordings"}
          {q || topic || year ? (
            <> · <Link href="/recordings">Clear filters</Link></>
          ) : null}
        </p>

        {shown.length ? (
          <div className="grid grid-3">{shown.map((r) => <RecordingItem key={r.id} rec={r} />)}</div>
        ) : (
          <div className="card"><p style={{ margin: 0 }}>No recordings match your search.</p></div>
        )}

        {pages > 1 && (
          <nav className="btn-row" style={{ justifyContent: "center", marginTop: 32 }} aria-label="Pages">
            {page > 1 && <Link className="btn btn-quiet btn-sm" href={link({ page: page - 1 })}>← Newer</Link>}
            <span className="small muted" style={{ alignSelf: "center" }}>Page {page} of {pages}</span>
            {page < pages && <Link className="btn btn-quiet btn-sm" href={link({ page: page + 1 })}>Older →</Link>}
          </nav>
        )}
      </section>
    </>
  );
}
