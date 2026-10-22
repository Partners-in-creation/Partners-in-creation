import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { ClassForm } from "@/components/ClassForm";

export default async function NewClass() {
  const settings = await getSettings();
  return (
    <>
      <Link href="/admin/classes" className="small">← Classes</Link>
      <h1>New class</h1>
      <p className="muted">For a one-off class. For the regular weekly classes, <Link href="/admin/series/new">set up a weekly schedule</Link> instead.</p>
      <ClassForm defaultTimezone={settings.timezone} />
    </>
  );
}
