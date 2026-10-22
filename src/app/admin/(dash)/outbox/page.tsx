import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";

export default async function Outbox() {
  const emails = await db.outboxEmail.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <h1>Sent emails</h1>
      {!emailConfigured() && (
        <div className="notice notice-info">
          Email sending isn&apos;t connected yet, so these messages were saved here but not delivered. See the README for setting up
          a sending address for the site.
        </div>
      )}
      {emails.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {emails.map((e) => (
            <details key={e.id} className="card card-flat" style={{ padding: "14px 18px" }}>
              <summary style={{ cursor: "pointer" }}>
                <b>{e.subject}</b> <span className="muted small">to {e.to} · {e.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</span>{" "}
                <span className={`badge ${e.status === "SENT" ? "badge-ok" : e.status === "FAILED" ? "badge-danger" : "badge-muted"}`}>
                  {e.status === "LOGGED" ? "Saved only" : e.status === "SENT" ? "Sent" : "Failed"}
                </span>
              </summary>
              {e.error && <p className="small" style={{ color: "var(--danger)" }}>{e.error}</p>}
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.92rem", margin: "12px 0 0" }}>{e.text}</pre>
            </details>
          ))}
        </div>
      ) : (
        <p className="muted">Nothing has been sent yet.</p>
      )}
    </>
  );
}
