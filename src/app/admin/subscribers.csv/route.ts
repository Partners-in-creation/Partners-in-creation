import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

function cell(v: string) {
  // Quote, and stop spreadsheet apps from treating a value as a formula.
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const subs = await db.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const rows = [
    ["email", "name", "status", "reminders", "announcements", "joined"],
    ...subs.map((s) => [
      s.email,
      s.name,
      s.unsubscribedAt ? "unsubscribed" : s.confirmedAt ? "subscribed" : "unconfirmed",
      s.wantsReminders ? "yes" : "no",
      s.wantsAnnouncements ? "yes" : "no",
      s.createdAt.toISOString().slice(0, 10),
    ]),
  ];
  return new Response(rows.map((r) => r.map(cell).join(",")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"' },
  });
}
