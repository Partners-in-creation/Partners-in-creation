import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDuration, mediaFor } from "@/lib/recordings";
import { isAdmin } from "@/lib/auth";
import { AudioPlayer } from "@/components/AudioPlayer";
import { RecordingItem, recordingDate } from "@/components/RecordingItem";
import { ShareButton, WhatsAppShare } from "@/components/ShareButton";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const rec = await db.recording.findUnique({ where: { slug } });
  if (!rec || (!rec.published && !(await isAdmin()))) return null;
  return rec;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rec = await load((await params).slug);
  if (!rec) return {};
  return { title: rec.title, description: rec.description.slice(0, 160) || `${rec.topic} · ${recordingDate(rec.recordedOn)}` };
}

export default async function RecordingPage({ params }: Props) {
  const rec = await load((await params).slug);
  if (!rec) notFound();
  const media = mediaFor(rec);

  // Related: same topic first, then the nearest recordings in time.
  const sameTopic = rec.topic
    ? await db.recording.findMany({ where: { published: true, topic: rec.topic, id: { not: rec.id } }, orderBy: { recordedOn: "desc" }, take: 3 })
    : [];
  const filler = sameTopic.length < 3
    ? await db.recording.findMany({
        where: { published: true, id: { notIn: [rec.id, ...sameTopic.map((r) => r.id)] } },
        orderBy: { recordedOn: "desc" },
        take: 3 - sameTopic.length,
      })
    : [];
  const related = [...sameTopic, ...filler];

  return (
    <>
      <article className="container narrow" style={{ padding: "clamp(40px, 7vw, 80px) var(--gutter) 48px" }}>
        <Link href="/recordings" className="small">← All recordings</Link>
        <div style={{ margin: "20px 0 10px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {rec.topic && <Link href={`/recordings?topic=${encodeURIComponent(rec.topic)}`} className="badge" style={{ textDecoration: "none" }}>{rec.topic}</Link>}
          {!rec.published && <span className="badge badge-muted">Hidden</span>}
          <span className="small muted">
            {recordingDate(rec.recordedOn)}
            {rec.durationSec ? ` · ${formatDuration(rec.durationSec)}` : ""}
          </span>
        </div>
        <h1>{rec.title}</h1>
        <div style={{ margin: "24px 0" }}>
          {media.playable ? (
            <AudioPlayer src={media.src} title={rec.title} />
          ) : media.src ? (
            <a className="btn" href={media.src} target="_blank" rel="noopener noreferrer">Listen on the original site</a>
          ) : (
            <p className="muted">Audio is not available yet.</p>
          )}
        </div>
        {rec.description && <div className="prose"><p>{rec.description}</p></div>}
        <div className="btn-row" style={{ marginTop: 24 }}>
          <ShareButton path={`/recordings/${rec.slug}`} title={rec.title} />
          <WhatsAppShare path={`/recordings/${rec.slug}`} title={rec.title} />
          {media.playable && <a className="btn btn-quiet btn-sm" href={media.src} download>Download</a>}
        </div>
      </article>
      {related.length > 0 && (
        <section className="section section-cream" aria-labelledby="related">
          <div className="container">
            <h2 id="related">Related recordings</h2>
            <div className="grid grid-3">{related.map((r) => <RecordingItem key={r.id} rec={r} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
