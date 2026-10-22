import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rememberMember } from "@/lib/member";

// Personal link from emails: remembers a confirmed subscriber on this device
// so subscriber-only class details are visible, then continues to `next`.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = req.nextUrl.searchParams.get("next") || "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const sub = await db.subscriber.findUnique({ where: { token } });
  if (sub && sub.confirmedAt && !sub.unsubscribedAt) await rememberMember(token);
  return NextResponse.redirect(new URL(next, req.nextUrl.origin), 303);
}
