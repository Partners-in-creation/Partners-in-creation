import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { todayIn } from "@/lib/series";
import { deleteSeries } from "../../../actions";
import { SeriesForm } from "@/components/SeriesForm";
import { ConfirmButton } from "@/components/AdminForm";
import { formatShortDate, formatTime } from "@/lib/time";
import { STATUSES } from "@/lib/classes";

export default async function EditSeries({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const { created, updated } = await searchParams;
  const [series, settings] = await Promise.all([db.classSeries.findUnique({ where: { id } }), getSettings()]);
  if (!series) notFound();
  const upcoming = await db.classSession.findMany({
    where: { seriesId: id, startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 30,
  });
  const lastDate = upcoming.at(-1);

  return (
    <>
      <Link href="/admin/classes" className="small">← Classes</Link>
      <h1>{series.title}</h1>
      {created !== undefined && (
        <div className="notice notice-ok">
          Saved. {Number(created) ? `${created} new date${created === "1" ? "" : "s"} added.` : ""}{" "}
          {Number(updated) ? `${updated} upcoming date${updated === "1" ? "" : "s"} updated.` : ""}
        </div>
      )}

      <h2 style={{ fontSize: "1.4rem" }}>Upcoming dates</h2>
      {upcoming.length ? (
        <div className="table-wrap" style={{ marginBottom: 12 }}>
          <table className="table">
            <tbody>
              {upcoming.map((s) => (
                <tr key={s.id}>
                  <td>{new Intl.DateTimeFormat("en-US", { timeZone: s.timezone, weekday: "short" }).format(s.startsAt)}, {formatShortDate(s.startsAt, s.timezone)} · {formatTime(s.startsAt, s.timezone)}</td>
                  <td>
                    {s.status !== "PUBLISHED" && <span className={`badge ${s.status === "CANCELLED" ? "badge-danger" : "badge-muted"}`}>{STATUSES[s.status as keyof typeof STATUSES]}</span>}{" "}
                    {s.edited && <span className="small muted">Edited</span>}
                  </td>
                  <td className="actions"><Link href={`/admin/classes/${s.id}`} className="btn btn-quiet btn-sm">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No upcoming dates. Use “Add dates” below.</p>
      )}
      {lastDate && <p className="small muted">Dates run through {formatShortDate(lastDate.startsAt, lastDate.timezone)}. Add more below when needed.</p>}

      <h2 style={{ fontSize: "1.4rem", marginTop: 32 }}>Schedule details</h2>
      <SeriesForm series={series} defaultTimezone={settings.timezone} today={todayIn(series.timezone)} />

      <form action={deleteSeries} style={{ marginTop: 32 }} className="card card-flat">
        <input type="hidden" name="id" value={series.id} />
        <label className="check" style={{ marginBottom: 12 }}>
          <input type="checkbox" name="removeFuture" defaultChecked /> Also remove its upcoming dates (past dates are kept)
        </label>
        <ConfirmButton className="btn btn-danger btn-sm" message="Delete this weekly schedule?">Delete schedule</ConfirmButton>
      </form>
    </>
  );
}
