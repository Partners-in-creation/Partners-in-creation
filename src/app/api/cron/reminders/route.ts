import { sendDueReminders } from "@/lib/notify";

// Call this every 15–60 minutes from a scheduler (Vercel Cron, GitHub Actions,
// cron-job.org...) with the header "Authorization: Bearer <CRON_SECRET>".
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendDueReminders();
  return Response.json(result);
}

export const GET = handle;
export const POST = handle;
