import { db } from "@/lib/db";
import { googleCalendarUrl } from "@/lib/calendar";
import { VISIBLE_STATUSES, calendarEventFor } from "@/lib/classes";
import { currentMember } from "@/lib/member";
import { isAdmin } from "@/lib/auth";

// Builds the Google Calendar link on request, so the address is only included
// for visitors who are allowed to see it.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await db.classSession.findUnique({ where: { id: (await params).id } });
  if (!s || !VISIBLE_STATUSES.includes(s.status)) return new Response("Not found", { status: 404 });
  const viewer = { isMember: !!(await currentMember()), isAdmin: await isAdmin() };
  return Response.redirect(googleCalendarUrl(calendarEventFor(s, viewer)), 302);
}
