import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rememberMember } from "@/lib/member";

export async function POST(req: NextRequest) {
  const token = String((await req.formData()).get("token") || "");
  const sub = token ? await db.subscriber.findUnique({ where: { token } }) : null;
  if (!sub) return NextResponse.redirect(new URL("/subscribe/confirm", req.nextUrl.origin), 303);
  await db.subscriber.update({ where: { id: sub.id }, data: { confirmedAt: sub.confirmedAt ?? new Date(), unsubscribedAt: null } });
  await rememberMember(sub.token);
  return NextResponse.redirect(new URL(`/subscribe/manage?token=${sub.token}&welcome=1`, req.nextUrl.origin), 303);
}
