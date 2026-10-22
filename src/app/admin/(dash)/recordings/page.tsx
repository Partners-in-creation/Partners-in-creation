import Link from "next/link";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/recordings";
import { recordingDate } from "@/components/RecordingItem";

export default async function AdminRecordings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const recs = await db.recording.findMany({ orderBy: { recordedOn: "desc" } });
  return (
    <>
      <div className="admin-top">
        <h1>Recordings</h1>
        <Link href="/admin/recordings/new" className="btn btn-sm">Add recording</Link>
      </div>
      {saved && <div className="notice notice-ok">{saved === "deleted" ? "Recording deleted." : "Recording saved."}</div>}
      {recs.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Title</th><th>Topic</th><th>Source</th><th /></tr></thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{recordingDate(r.recordedOn)}</td>
                  <td>
                    {r.title} {!r.published && <span className="badge badge-muted">Hidden</span>}
                    {r.durationSec ? <div className="small muted">{formatDuration(r.durationSec)}</div> : null}
                  </td>
                  <td>{r.topic}</td>
                  <td className="small">{r.storageKey ? "Uploaded" : "Link"}</td>
                  <td className="actions">
                    <Link href={`/admin/recordings/${r.id}`} className="btn btn-quiet btn-sm">Edit</Link>
                    <Link href={`/recordings/${r.slug}`} target="_blank" className="btn btn-quiet btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No recordings yet.</p>
      )}
    </>
  );
}
