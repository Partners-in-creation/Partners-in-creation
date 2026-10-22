import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token = "", done } = await searchParams;
  const sub = token ? await db.subscriber.findUnique({ where: { token } }) : null;
  return (
    <section className="container narrow center" style={{ padding: "clamp(64px, 10vw, 120px) var(--gutter)" }}>
      {done ? (
        <>
          <h1>You&apos;ve been unsubscribed</h1>
          <p className="muted">You won&apos;t receive any more emails. You&apos;re welcome back anytime.</p>
          <Link href="/" className="btn btn-outline">Back to the homepage</Link>
        </>
      ) : sub ? (
        <>
          <h1>Unsubscribe?</h1>
          <p className="muted">{sub.email} will stop receiving all emails from us.</p>
          <form method="post" action="/m/unsubscribe" className="btn-row" style={{ justifyContent: "center" }}>
            <input type="hidden" name="token" value={token} />
            <button className="btn">Unsubscribe</button>
            <Link href={`/subscribe/manage?token=${token}`} className="btn btn-quiet">Choose which emails instead</Link>
          </form>
        </>
      ) : (
        <>
          <h1>Link not recognised</h1>
          <p className="muted">If you keep receiving emails, reply to one and we&apos;ll remove you.</p>
        </>
      )}
    </section>
  );
}
