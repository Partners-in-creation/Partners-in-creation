import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { deleteClass } from "../../../actions";
import { ClassForm } from "@/components/ClassForm";
import { ConfirmButton } from "@/components/AdminForm";

export default async function EditClass({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, settings] = await Promise.all([
    db.classSession.findUnique({ where: { id }, include: { series: true, _count: { select: { rsvps: true } } } }),
    getSettings(),
  ]);
  if (!session) notFound();
  return (
    <>
      <Link href="/admin/classes" className="small">← Classes</Link>
      <div className="admin-top" style={{ marginTop: 8 }}>
        <h1>Edit class</h1>
        <Link href={`/classes/${session.id}`} target="_blank" className="btn btn-quiet btn-sm">View on site ↗</Link>
      </div>
      {session.series && (
        <p className="notice notice-info">
          This date is part of the weekly schedule <Link href={`/admin/series/${session.series.id}`}>{session.series.title}</Link>.
          Changes here apply to this date only.
        </p>
      )}
      {session._count.rsvps > 0 && <p><Link href="/admin/rsvps">{session._count.rsvps} attendance request(s)</Link> for this class.</p>}
      <ClassForm session={session} defaultTimezone={settings.timezone} />
      <form action={deleteClass} style={{ marginTop: 32 }}>
        <input type="hidden" name="id" value={session.id} />
        <ConfirmButton className="btn btn-danger btn-sm" message="Delete this class permanently? To skip a date, cancel it instead so subscribers are told.">
          Delete class
        </ConfirmButton>
      </form>
    </>
  );
}
