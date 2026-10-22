import type { Metadata } from "next";
import { SubscribeForm } from "@/components/Forms";
import { currentMember } from "@/lib/member";

export const metadata: Metadata = { title: "Subscribe" };

export default async function SubscribePage() {
  const member = await currentMember();
  return (
    <section className="container narrow" style={{ padding: "clamp(48px, 8vw, 96px) var(--gutter)" }}>
      <span className="eyebrow">Subscribe</span>
      <h1>Stay connected</h1>
      <p className="muted" style={{ fontSize: "1.1rem" }}>
        Receive a reminder before each class, notice of schedule changes, and community announcements. We only email about
        Partners In Creation, and you can unsubscribe at any time.
      </p>
      {member ? (
        <div className="notice notice-ok">
          You&apos;re subscribed as {member.email}. <a href={`/subscribe/manage?token=${member.token}`}>Manage your emails</a>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 24 }}><SubscribeForm /></div>
      )}
    </section>
  );
}
