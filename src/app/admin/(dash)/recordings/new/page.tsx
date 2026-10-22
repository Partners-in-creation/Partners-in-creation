import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { todayIn } from "@/lib/series";
import { RecordingForm } from "@/components/RecordingForm";

export default async function NewRecording() {
  const [settings, topics] = await Promise.all([
    getSettings(),
    db.recording.findMany({ where: { topic: { not: "" } }, distinct: ["topic"], select: { topic: true } }),
  ]);
  return (
    <>
      <Link href="/admin/recordings" className="small">← Recordings</Link>
      <h1>Add recording</h1>
      <RecordingForm topics={topics.map((t) => t.topic)} today={todayIn(settings.timezone)} />
    </>
  );
}
