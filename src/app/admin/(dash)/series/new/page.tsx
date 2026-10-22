import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { todayIn } from "@/lib/series";
import { SeriesForm } from "@/components/SeriesForm";

export default async function NewSeries() {
  const settings = await getSettings();
  return (
    <>
      <Link href="/admin/classes" className="small">← Classes</Link>
      <h1>New weekly schedule</h1>
      <p className="muted">Choose the days and time once. The site adds each date to the calendar, and you can still change or cancel any single date.</p>
      <SeriesForm defaultTimezone={settings.timezone} today={todayIn(settings.timezone)} />
    </>
  );
}
