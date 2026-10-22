import Link from "next/link";
import { db } from "@/lib/db";
import { PreferencesForm } from "@/components/PreferencesForm";

export const metadata = { title: "Email preferences", robots: { index: false } };

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ token?: string; welcome?: string }> }) {
  const { token = "", welcome } = await searchParams;
  const sub = token ? await db.subscriber.findUnique({ where: { token } }) : null;
  return (
    <section className="container narrow" style={{ padding: "clamp(48px, 8vw, 96px) var(--gutter)" }}>
      {sub ? (
        <>
          {welcome && <div className="notice notice-ok">Thank you. Your subscription is confirmed.</div>}
          <h1>Email preferences</h1>
          <p className="muted">{sub.email}</p>
          <div className="card">
            <PreferencesForm
              token={sub.token}
              name={sub.name}
              reminders={!sub.unsubscribedAt && sub.wantsReminders}
              announcements={!sub.unsubscribedAt && sub.wantsAnnouncements}
            />
          </div>
        </>
      ) : (
        <>
          <h1>Link not recognised</h1>
          <p className="muted">Use the link at the bottom of any of our emails, or <Link href="/subscribe">subscribe again</Link>.</p>
        </>
      )}
    </section>
  );
}
