import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteRecording } from "../../../actions";
import { RecordingForm } from "@/components/RecordingForm";
import { ConfirmButton } from "@/components/AdminForm";

export default async function EditRecording({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rec, topics] = await Promise.all([
    db.recording.findUnique({ where: { id } }),
    db.recording.findMany({ where: { topic: { not: "" } }, distinct: ["topic"], select: { topic: true } }),
  ]);
  if (!rec) notFound();
  return (
    <>
      <Link href="/admin/recordings" className="small">← Recordings</Link>
      <h1>Edit recording</h1>
      <RecordingForm rec={rec} topics={topics.map((t) => t.topic)} today="" />
      <form action={deleteRecording} style={{ marginTop: 32 }}>
        <input type="hidden" name="id" value={rec.id} />
        <ConfirmButton className="btn btn-danger btn-sm" message="Delete this recording and its audio file permanently?">Delete recording</ConfirmButton>
      </form>
    </>
  );
}
