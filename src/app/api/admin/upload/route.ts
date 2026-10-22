import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { isAdmin } from "@/lib/auth";
import { isValidKey, localPathFor, storageDriver } from "@/lib/storage";

// Streams an uploaded file to disk without holding it in memory.
export async function PUT(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (storageDriver() !== "local") return Response.json({ error: "Uploads go to cloud storage" }, { status: 400 });
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!isValidKey(key) || !req.body) return Response.json({ error: "Bad request" }, { status: 400 });

  const maxBytes = Number(process.env.MAX_UPLOAD_MB || 500) * 1024 * 1024;
  const file = localPathFor(key);
  await mkdir(path.dirname(file), { recursive: true });

  let size = 0;
  const limit = new Transform({
    transform(chunk, _enc, cb) {
      size += chunk.length;
      if (size > maxBytes) cb(new Error("File is too large"));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), limit, createWriteStream(file, { flags: "wx" }));
  } catch (err) {
    await unlink(file).catch(() => undefined);
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
  return Response.json({ key, size });
}
