import { db } from "@/lib/db";
import { inviteSubscriber, removeSubscriber } from "../../actions";
import { AdminForm, ConfirmButton } from "@/components/AdminForm";

export default async function AdminSubscribers() {
  const subs = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const active = subs.filter((s) => s.confirmedAt && !s.unsubscribedAt);
  const status = (s: (typeof subs)[number]) =>
    s.unsubscribedAt ? <span className="badge badge-muted">Unsubscribed</span> : s.confirmedAt ? <span className="badge badge-ok">Subscribed</span> : <span className="badge">Not confirmed</span>;

  return (
    <>
      <div className="admin-top">
        <h1>Subscribers</h1>
        <a href="/admin/subscribers.csv" className="btn btn-quiet btn-sm">Download CSV</a>
      </div>
      <div className="stat-grid">
        <div className="stat"><b>{active.length}</b><span>Subscribed</span></div>
        <div className="stat"><b>{active.filter((s) => s.wantsReminders).length}</b><span>Get class reminders</span></div>
        <div className="stat"><b>{active.filter((s) => s.wantsAnnouncements).length}</b><span>Get announcements</span></div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.3rem" }}>Invite someone</h2>
        <p className="small muted">They&apos;ll get an email asking them to confirm. People are only added once they confirm themselves.</p>
        <AdminForm action={inviteSubscriber} className="" submitLabel="Send invitation">
          <div className="form-row">
            <div className="field"><label htmlFor="inv-name">Name</label><input id="inv-name" name="name" type="text" /></div>
            <div className="field"><label htmlFor="inv-email">Email</label><input id="inv-email" name="email" type="email" required /></div>
          </div>
        </AdminForm>
      </div>

      {subs.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Email</th><th>Name</th><th>Status</th><th>Receives</th><th /></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.name}</td>
                  <td>{status(s)}</td>
                  <td className="small">{[s.wantsReminders && "Reminders", s.wantsAnnouncements && "Announcements"].filter(Boolean).join(", ")}</td>
                  <td className="actions">
                    <form action={removeSubscriber}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton message={`Remove ${s.email}?`}>Remove</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No subscribers yet. Share the site link in the WhatsApp group to invite people.</p>
      )}
    </>
  );
}
