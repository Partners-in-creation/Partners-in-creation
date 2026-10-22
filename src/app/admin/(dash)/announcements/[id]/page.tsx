import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteAnnouncement } from "../../../actions";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { ConfirmButton } from "@/components/AdminForm";

export default async function EditAnnouncement({ params }: { params: Promise<{ id: string }> }) {
  const a = await db.announcement.findUnique({ where: { id: (await params).id } });
  if (!a) notFound();
  return (
    <>
      <Link href="/admin/announcements" className="small">← Announcements</Link>
      <h1>Edit update</h1>
      <AnnouncementForm a={a} />
      <form action={deleteAnnouncement} style={{ marginTop: 32 }}>
        <input type="hidden" name="id" value={a.id} />
        <ConfirmButton className="btn btn-danger btn-sm" message="Delete this update?">Delete update</ConfirmButton>
      </form>
    </>
  );
}
