import type { Metadata } from "next";
import Link from "next/link";
import { getSettings, isPlaceholder } from "@/lib/settings";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <header className="page-head">
        <div className="container narrow">
          <span className="eyebrow">About</span>
          <h1>{s.aboutTitle}</h1>
        </div>
      </header>
      <section className="container narrow" style={{ paddingBottom: 64 }}>
        {s.aboutPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.aboutPhotoUrl} alt={s.aboutTitle} style={{ borderRadius: "var(--radius-lg)", marginBottom: 32, maxHeight: 460, objectFit: "cover", width: "100%" }} />
        )}
        <div className={`prose${isPlaceholder(s.aboutText) ? " placeholder-text" : ""}`}><p>{s.aboutText}</p></div>
        <hr className="rule" />
        <h2>{s.siteName}</h2>
        <div className={`prose${isPlaceholder(s.communityText) ? " placeholder-text" : ""}`}><p>{s.communityText}</p></div>
        <div className="btn-row" style={{ marginTop: 32 }}>
          <Link href="/classes" className="btn">Upcoming classes</Link>
          <Link href="/subscribe" className="btn btn-outline">Subscribe</Link>
          {s.whatsappUrl && <a href={s.whatsappUrl} className="btn btn-quiet" target="_blank" rel="noopener noreferrer">WhatsApp group</a>}
        </div>
      </section>
    </>
  );
}
