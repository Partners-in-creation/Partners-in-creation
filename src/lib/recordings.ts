import type { Recording } from "@prisma/client";
import { publicMediaUrl } from "./storage";

const DIRECT_MEDIA = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|mp4|m4v)(\?.*)?$/i;

/**
 * Turns a supported external link into something an <audio> tag can play.
 * Supported: direct links to audio files, Dropbox share links and Google Drive
 * file links. Anything else is shown as a "listen on the original site" link.
 */
export function normalizeExternalUrl(raw: string): { url: string; playable: boolean } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { url: raw, playable: false };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { url: raw, playable: false };

  if (url.hostname.endsWith("dropbox.com")) {
    url.searchParams.delete("dl");
    url.searchParams.set("raw", "1");
    return { url: url.toString(), playable: true };
  }
  if (url.hostname === "drive.google.com") {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
    if (id) return { url: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`, playable: true };
  }
  return { url: url.toString(), playable: DIRECT_MEDIA.test(url.pathname) };
}

export function mediaFor(rec: Pick<Recording, "storageKey" | "externalUrl">): { src: string; playable: boolean } {
  if (rec.storageKey) return { src: publicMediaUrl(rec.storageKey), playable: true };
  if (rec.externalUrl) {
    const n = normalizeExternalUrl(rec.externalUrl);
    return { src: n.url, playable: n.playable };
  }
  return { src: "", playable: false };
}

export function formatDuration(sec: number | null | undefined): string {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h) return `${h} hr ${m} min`;
  if (!m) return "Under 1 min";
  return `${m} min`;
}
