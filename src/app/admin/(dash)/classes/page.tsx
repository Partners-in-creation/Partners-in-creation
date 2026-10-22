import Link from "next/link";
import { db } from "@/lib/db";
import { quickStatus } from "../../actions";
import { WEEKDAYS, formatShortDate, formatTime } from "@/lib/time";
import { seriesDays } from "@/lib/series";
import { STATUSES, VISIBILITY } from "@/lib/classes";
import { ConfirmButton } from "@/components/AdminForm";

const SAVED: Record<string, string> = {
  "1": "Class saved.",
  deleted: "Class deleted.",
  "series-deleted": "Weekly schedule deleted.",
};

function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function savedText(v?: string) {
  if (!v) return "";
  if (v.startsWith("notified-")) return `Class saved and ${v.slice(9)} people were notified.`;
  return SAVED[v] ?? "";
}

export default async function AdminClasses({ searchParams }: { searchParams: Promise<{ saved?: string; show?: string }> }) {
  const { saved, show } = await searchParams;
  const past = show === "past";
  const now = new Date();
  const [series, sessions] = await Promise.all([
    db.classSeries.findMany({ orderBy: { createdAt: "asc" } }),
    db.classSession.findMany({
      where: past ? { startsAt: { lt: now } } : { startsAt: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) } },
      orderBy: { startsAt: past ? "desc" : "asc" },
      take: 80,
      include: { _count: { select: { rsvps: true } } },
    }),
  ]);
  const msg = savedText(saved);

  return (
    <>
      <div className="admin-top">
        <h1>Classes</h1>
        <div className="btn-row">
          <Link href="/admin/classes/new" className="btn btn-sm">New single class</Link>
          <Link href="/admin/series/new" className="btn btn-outline btn-sm">New weekly schedule</Link>
        </div>
      </div>
      {msg && <div className="notice notice-ok">{msg}</div>}

      <h2 style={{ fontSize: "1.5rem" }}>Weekly schedules</h2>
      {series.length ? (
        <div className="table-wrap" style={{ marginBottom: 32 }}>
          <table className="table">
            <thead><tr><th>Title</th><th>When</th><th>Address shown to</th><th /></tr></thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.id}>
                  <td>{s.title} {!s.active && <span className="badge badge-muted">Paused</span>}</td>
                  <td>{seriesDays(s).map((d) => WEEKDAYS[d]).join(" & ")} at {clock(s.startTime)}</td>
                  <td>{VISIBILITY[s.locationVisibility as keyof typeof VISIBILITY].split(":")[0]}</td>
                  <td className="actions"><Link href={`/admin/series/${s.id}`} className="btn btn-quiet btn-sm">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card card-flat" style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0 }}>Set up the regular twice-weekly classes once, and the site creates each date for you. You can still change or cancel any single date for holidays.</p>
          <Link href="/admin/series/new" className="btn btn-sm">Set up the weekly schedule</Link>
        </div>
      )}

      <div className="admin-top">
        <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{past ? "Past classes" : "Upcoming classes"}</h2>
        <Link href={past ? "/admin/classes" : "/admin/classes?show=past"} className="small">{past ? "Show upcoming" : "Show past classes"}</Link>
      </div>
      {sessions.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Class</th><th>Status</th><th /></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Intl.DateTimeFormat("en-US", { timeZone: s.timezone, weekday: "short" }).format(s.startsAt)}, {formatShortDate(s.startsAt, s.timezone)}
                    <div className="muted small">{formatTime(s.startsAt, s.timezone)}</div>
                  </td>
                  <td>
                    {s.title}
                    {s._count.rsvps > 0 && <div className="small muted">{s._count.rsvps} attendance request{s._count.rsvps > 1 ? "s" : ""}</div>}
                  </td>
                  <td>
                    <span className={`badge ${s.status === "CANCELLED" ? "badge-danger" : s.status === "DRAFT" ? "badge-muted" : s.status === "RESCHEDULED" ? "" : "badge-ok"}`}>
                      {STATUSES[s.status as keyof typeof STATUSES]}
                    </span>
                  </td>
                  <td className="actions">
                    <Link href={`/admin/classes/${s.id}`} className="btn btn-quiet btn-sm">Edit</Link>
                    {!past && s.status !== "CANCELLED" && (
                      <form action={quickStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="CANCELLED" />
                        <input type="hidden" name="notify" value="on" />
                        <ConfirmButton message={`Cancel "${s.title}" and email subscribers?`}>Cancel</ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No classes here yet.</p>
      )}
    </>
  );
}
