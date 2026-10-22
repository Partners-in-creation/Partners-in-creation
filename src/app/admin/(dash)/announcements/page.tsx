import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CATEGORIES, announcementDate } from "@/components/AnnouncementItem";

export default async function AdminAnnouncements({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const [settings, items] = await Promise.all([getSettings(), db.announcement.findMany({ orderBy: { publishedAt: "desc" } })]);
  const msg = !saved ? "" : saved === "deleted" ? "Update deleted." : saved.startsWith("notified-") ? `Saved and emailed to ${saved.slice(9)} subscribers.` : "Update saved.";
  return (
    <>
      <div className="admin-top">
        <h1>Announcements</h1>
        <Link href="/admin/announcements/new" className="btn btn-sm">Post update</Link>
      </div>
      {msg && <div className="notice notice-ok">{msg}</div>}
      {items.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Emailed</th><th /></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{announcementDate(a.publishedAt, settings.timezone)}</td>
                  <td>
                    {a.title} {a.pinned && <span className="badge badge-muted">Pinned</span>} {!a.published && <span className="badge badge-muted">Hidden</span>}
                  </td>
                  <td>{CATEGORIES[a.category as keyof typeof CATEGORIES]}</td>
                  <td className="small">{a.notifiedAt ? announcementDate(a.notifiedAt, settings.timezone) : "No"}</td>
                  <td className="actions"><Link href={`/admin/announcements/${a.id}`} className="btn btn-quiet btn-sm">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No updates yet.</p>
      )}
    </>
  );
}
