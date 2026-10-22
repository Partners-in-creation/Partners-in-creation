import Link from "next/link";
import type { ClassSession } from "@prisma/client";
import { FORMATS, locationFor, type Viewer } from "@/lib/classes";
import { formatDate, formatTimeRange } from "@/lib/time";

export function StatusBadge({ status }: { status: string }) {
  if (status === "CANCELLED") return <span className="badge badge-danger">Cancelled</span>;
  if (status === "RESCHEDULED") return <span className="badge">Rescheduled</span>;
  if (status === "DRAFT") return <span className="badge badge-muted">Draft</span>;
  return null;
}

export function FormatBadge({ format }: { format: string }) {
  return <span className="badge badge-navy">{FORMATS[format as keyof typeof FORMATS] ?? format}</span>;
}

export function DateTile({ date, timeZone }: { date: Date; timeZone: string }) {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(date);
  const mon = new Intl.DateTimeFormat("en-US", { timeZone, month: "short", weekday: "short" }).format(date);
  return (
    <div className="list-date" aria-hidden="true">
      <span className="day">{day}</span>
      <span className="mon">{mon}</span>
    </div>
  );
}

export function CalendarLinks({ id }: { id: string }) {
  return (
    <div className="btn-row">
      <a className="btn btn-outline btn-sm" href={`/classes/${id}/calendar.ics`}>Add to calendar</a>
      <a className="btn btn-quiet btn-sm" href={`/classes/${id}/google`} target="_blank" rel="noopener noreferrer">Google Calendar</a>
    </div>
  );
}

/** Location lines for a class, respecting the address privacy setting. */
export function LocationDetails({ session, viewer }: { session: ClassSession; viewer: Viewer }) {
  const loc = locationFor(session, viewer);
  return (
    <>
      {loc.hasPhysical && (
        <li>
          <span className="label">Where</span>
          <span>
            {loc.venueName || (loc.revealed ? "" : "Location to be shared")}
            {loc.address && (
              <>
                {loc.venueName && <br />}
                {loc.address}
              </>
            )}
            {loc.directionsUrl && (
              <>
                <br />
                <a href={loc.directionsUrl} target="_blank" rel="noopener noreferrer">Directions</a>
              </>
            )}
          </span>
        </li>
      )}
      {loc.hasOnline && (
        <li>
          <span className="label">Online</span>
          <span>
            {loc.meetingUrl ? (
              <a href={loc.meetingUrl} target="_blank" rel="noopener noreferrer">Join the class online</a>
            ) : loc.revealed ? (
              "Link to be shared"
            ) : (
              "Link shared with members"
            )}
          </span>
        </li>
      )}
    </>
  );
}

export function LockedNote({ session, viewer }: { session: ClassSession; viewer: Viewer }) {
  const loc = locationFor(session, viewer);
  if (loc.revealed) return null;
  if (loc.lockedReason === "SUBSCRIBERS") {
    return (
      <div className="locked">
        The {loc.hasPhysical ? "address" : "link"} is shared with subscribers.{" "}
        <Link href="/subscribe">Subscribe</Link> and use the link in any of our emails to see it on this device.
      </div>
    );
  }
  return (
    <div className="locked">
      The {loc.hasPhysical ? "address" : "link"} is shared privately with attendees.{" "}
      <Link href={`/classes/${session.id}#attend`}>Ask to attend</Link> and you&apos;ll receive the details by email.
    </div>
  );
}

export function ClassListItem({ session }: { session: ClassSession }) {
  const cancelled = session.status === "CANCELLED";
  return (
    <article className={`list-item${cancelled ? " is-cancelled" : ""}`}>
      <DateTile date={session.startsAt} timeZone={session.timezone} />
      <div>
        <h3>
          <Link href={`/classes/${session.id}`}>{session.title}</Link>
        </h3>
        <div className="muted small">
          {formatDate(session.startsAt, session.timezone)} · {formatTimeRange(session.startsAt, session.endsAt, session.timezone)}
          {session.format !== "ONLINE" && session.venueName ? ` · ${session.venueName}` : ""}
        </div>
        {session.statusNote && <p className="small" style={{ margin: "6px 0 0" }}>{session.statusNote}</p>}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <StatusBadge status={session.status} />
        <FormatBadge format={session.format} />
      </div>
    </article>
  );
}
