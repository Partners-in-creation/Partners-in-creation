import Link from "next/link";
import { db } from "@/lib/db";
import { decideRsvp } from "../../actions";
import { whenText } from "@/lib/classes";

export default async function AdminRsvps() {
  const rsvps = await db.rsvp.findMany({
    where: { session: { startsAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    include: { session: true },
    orderBy: [{ session: { startsAt: "asc" } }, { createdAt: "asc" }],
  });
  return (
    <>
      <h1>Attendees</h1>
      <p className="muted">
        For classes with a private address, visitors ask to attend. Approving someone emails them the address and meeting
        link for that class.
      </p>
      {rsvps.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Class</th><th>Person</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/admin/classes/${r.sessionId}`}>{r.session.title}</Link><div className="small muted">{whenText(r.session)}</div></td>
                  <td>
                    {r.name}<div className="small"><a href={`mailto:${r.email}`}>{r.email}</a></div>
                    {r.note && <div className="small muted">“{r.note}”</div>}
                  </td>
                  <td>
                    <span className={`badge ${r.status === "APPROVED" ? "badge-ok" : r.status === "DECLINED" ? "badge-muted" : ""}`}>
                      {r.status === "PENDING" ? "Waiting" : r.status === "APPROVED" ? "Approved" : "Declined"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {r.status !== "APPROVED" && (
                        <form action={decideRsvp}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <button className="btn btn-sm">Approve &amp; send address</button>
                        </form>
                      )}
                      {r.status === "PENDING" && (
                        <form action={decideRsvp}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="DECLINED" />
                          <button className="btn btn-quiet btn-sm">Decline</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No requests for upcoming classes.</p>
      )}
    </>
  );
}
