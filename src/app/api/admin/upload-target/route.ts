import { isAdmin } from "@/lib/auth";
import { MIME_BY_EXT, newStorageKey, presignS3, publicMediaUrl, storageDriver } from "@/lib/storage";
import path from "node:path";

// Tells the browser where to send an audio file: straight to cloud storage
// with a presigned URL, or to this server's upload route.
export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { name, type } = (await req.json().catch(() => ({}))) as { name?: string; type?: string };
  if (!name) return Response.json({ error: "Missing file name" }, { status: 400 });
  const key = newStorageKey(name);
  const contentType = type || MIME_BY_EXT[path.extname(name).toLowerCase()] || "application/octet-stream";
  if (!/^(audio|video)\//.test(contentType)) return Response.json({ error: "Please choose an audio file." }, { status: 400 });
  const url = storageDriver() === "s3" ? presignS3("PUT", key, contentType) : `/api/admin/upload?key=${encodeURIComponent(key)}`;
  return Response.json({ key, url, contentType, playbackUrl: publicMediaUrl(key) });
}
