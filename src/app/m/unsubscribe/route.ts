import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { forgetMember } from "@/lib/member";

// Handles the unsubscribe button and one-click unsubscribe from mail apps (RFC 8058).
export async function POST(req: NextRequest) {
  let token = req.nextUrl.searchParams.get("token") || "";
  if (!token) {
    try {
      token = String((await req.formData()).get("token") || "");
    } catch {
      token = "";
    }
  }
  if (token) {
    await db.subscriber.updateMany({ where: { token, unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
    await forgetMember();
  }
  return NextResponse.redirect(new URL("/subscribe/unsubscribe?done=1", req.nextUrl.origin), 303);
}
