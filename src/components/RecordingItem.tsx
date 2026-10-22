import Link from "next/link";
import type { Recording } from "@prisma/client";
import { AudioPlayer } from "./AudioPlayer";
import { formatDuration, mediaFor } from "@/lib/recordings";

export function recordingDate(d: Date) {
  // Recording dates are calendar dates, stored at UTC midnight.
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(d);
}

export function RecordingItem({ rec, player = true }: { rec: Recording; player?: boolean }) {
  const media = mediaFor(rec);
  return (
    <article className="card card-flat" style={{ display: "grid", gap: 12 }}>
      <div>
        <div className="small muted">
          {recordingDate(rec.recordedOn)}
          {rec.durationSec ? ` · ${formatDuration(rec.durationSec)}` : ""}
        </div>
        <h3 style={{ margin: "4px 0 6px" }}>
          <Link href={`/recordings/${rec.slug}`} style={{ textDecoration: "none" }}>{rec.title}</Link>
        </h3>
        {rec.topic && (
          <Link href={`/recordings?topic=${encodeURIComponent(rec.topic)}`} className="badge" style={{ textDecoration: "none" }}>
            {rec.topic}
          </Link>
        )}
      </div>
      {player &&
        (media.playable ? (
          <AudioPlayer src={media.src} title={rec.title} />
        ) : media.src ? (
          <a className="btn btn-outline btn-sm" href={media.src} target="_blank" rel="noopener noreferrer" style={{ justifySelf: "start" }}>
            Listen on the original site
          </a>
        ) : null)}
    </article>
  );
}
