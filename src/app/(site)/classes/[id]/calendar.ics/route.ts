import { db } from "@/lib/db";
import { buildIcs } from "@/lib/calendar";
import { VISIBLE_STATUSES, calendarEventFor } from "@/lib/classes";
import { currentMember } from "@/lib/member";
import { isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await db.classSession.findUnique({ where: { id: (await params).id } });
  if (!s || !VISIBLE_STATUSES.includes(s.status)) return new Response("Not found", { status: 404 });
  const viewer = { isMember: !!(await currentMember()), isAdmin: await isAdmin() };
  return new Response(buildIcs(calendarEventFor(s, viewer)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(s.title)}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
