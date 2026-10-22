import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import path from "node:path";

// Audio files never go in the database. They are stored either:
//  - on local disk (UPLOAD_DIR, default ./uploads), served by /api/media, or
//  - in S3-compatible object storage (Cloudflare R2, AWS S3, Backblaze B2...),
//    uploaded straight from the browser with a presigned URL and played from
//    S3_PUBLIC_URL. Set the S3_* variables to switch.

export function storageDriver(): "s3" | "local" {
  return process.env.S3_BUCKET ? "s3" : "local";
}

export function uploadDir(): string {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

const SAFE_EXT = /^\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|mp4|m4v|mov)$/i;

export function newStorageKey(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path
    .basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `recordings/${folder}/${randomBytes(6).toString("hex")}-${base || "audio"}${SAFE_EXT.test(ext) ? ext : ".bin"}`;
}

/** Keys must look like ones newStorageKey makes, so they can never escape the upload folder. */
export function isValidKey(key: string): boolean {
  return /^recordings\/\d{4}\/\d{2}\/[a-f0-9]{12}-[a-z0-9-]*\.[a-z0-9]+$/.test(key);
}

export function localPathFor(key: string): string {
  if (!isValidKey(key)) throw new Error("Invalid storage key");
  return path.join(uploadDir(), key);
}

export function publicMediaUrl(key: string): string {
  if (storageDriver() === "s3") {
    const base = (process.env.S3_PUBLIC_URL || "").replace(/\/$/, "");
    return `${base}/${key}`;
  }
  return `/api/media/${key}`;
}

export const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
};

// --- S3 presigned PUT (AWS Signature V4, query-string form) ---

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data).digest();
}

/** Presigned S3 URL for PUT (upload, with content type) or DELETE. */
export function presignS3(method: "PUT" | "DELETE", key: string, contentType = "", expiresSec = 3600): string {
  const bucket = process.env.S3_BUCKET!;
  const region = process.env.S3_REGION || "auto";
  const accessKey = process.env.S3_ACCESS_KEY_ID!;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY!;
  const endpoint = new URL(process.env.S3_ENDPOINT || `https://s3.${region}.amazonaws.com`);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${region}/s3/aws4_request`;
  const host = endpoint.host;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const canonicalUri = `${endpoint.pathname.replace(/\/$/, "")}/${bucket}/${encodedKey}`;

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSec),
    "X-Amz-SignedHeaders": contentType ? "content-type;host" : "host",
  });
  query.sort();
  const canonicalQuery = query.toString().replace(/\+/g, "%20");
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    contentType ? `content-type:${contentType}\nhost:${host}\n` : `host:${host}\n`,
    contentType ? "content-type;host" : "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, day), region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  return `${endpoint.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export async function deleteStoredFile(key: string) {
  if (!isValidKey(key)) return;
  if (storageDriver() === "s3") {
    await fetch(presignS3("DELETE", key), { method: "DELETE" }).catch(() => undefined);
  } else {
    const { unlink } = await import("node:fs/promises");
    await unlink(localPathFor(key)).catch(() => undefined);
  }
}
