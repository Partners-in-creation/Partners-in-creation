import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Confirm subscription", robots: { index: false } };

// Confirmation happens on a button press (a POST to /m/confirm), so link
// scanners in email clients can't confirm on someone's behalf.
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const sub = token ? await db.subscriber.findUnique({ where: { token } }) : null;
  return (
    <section className="container narrow center" style={{ padding: "clamp(64px, 10vw, 120px) var(--gutter)" }}>
      {sub ? (
        <>
          <h1>Confirm your subscription</h1>
          <p className="muted">{sub.email}</p>
          <form method="post" action="/m/confirm">
            <input type="hidden" name="token" value={token} />
            <button className="btn">Yes, subscribe me</button>
          </form>
        </>
      ) : (
        <>
          <h1>This link has expired</h1>
          <p className="muted">Please <Link href="/subscribe">subscribe again</Link>.</p>
        </>
      )}
    </section>
  );
}
