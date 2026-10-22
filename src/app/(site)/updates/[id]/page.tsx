import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isAdmin } from "@/lib/auth";
import { CATEGORIES, announcementDate } from "@/components/AnnouncementItem";
import { ShareButton, WhatsAppShare } from "@/components/ShareButton";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const a = await db.announcement.findUnique({ where: { id } });
  if (!a) return null;
  if ((!a.published || a.publishedAt > new Date()) && !(await isAdmin())) return null;
  return a;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await load((await params).id);
  return a ? { title: a.title, description: a.body.slice(0, 160) } : {};
}

export default async function UpdatePage({ params }: Props) {
  const a = await load((await params).id);
  if (!a) notFound();
  const settings = await getSettings();
  return (
    <article className="container narrow" style={{ padding: "clamp(40px, 7vw, 80px) var(--gutter)" }}>
      <Link href="/updates" className="small">← All updates</Link>
      <div style={{ margin: "20px 0 10px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="badge">{CATEGORIES[a.category as keyof typeof CATEGORIES] ?? a.category}</span>
        <span className="small muted">{announcementDate(a.publishedAt, settings.timezone)}</span>
      </div>
      <h1>{a.title}</h1>
      <div className="prose"><p>{a.body}</p></div>
      <div className="btn-row" style={{ marginTop: 24 }}>
        <ShareButton path={`/updates/${a.id}`} title={a.title} />
        <WhatsAppShare path={`/updates/${a.id}`} title={a.title} />
      </div>
    </article>
  );
}
