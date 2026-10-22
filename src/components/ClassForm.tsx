import type { ClassSession } from "@prisma/client";
import { saveClass } from "@/app/admin/actions";
import { AdminForm } from "./AdminForm";
import { LocationFields, TimezoneSelect } from "./ClassFields";
import { STATUSES } from "@/lib/classes";
import { utcToZonedInputs } from "@/lib/time";

export function ClassForm({ session, defaultTimezone }: { session?: ClassSession | null; defaultTimezone: string }) {
  const tz = session?.timezone ?? defaultTimezone;
  const start = session ? utcToZonedInputs(session.startsAt, tz) : { date: "", time: "20:00" };
  const end = session?.endsAt ? utcToZonedInputs(session.endsAt, tz).time : "";
  const isNew = !session;

  return (
    <AdminForm action={saveClass} submitLabel={isNew ? "Create class" : "Save changes"}>
      {session && <input type="hidden" name="id" value={session.id} />}
      <div className="card">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required defaultValue={session?.title ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="description">Description <span className="muted">(optional)</span></label>
          <textarea id="description" name="description" defaultValue={session?.description ?? ""} />
        </div>
      </div>

      <div className="card">
        <fieldset>
          <legend>When</legend>
          <div className="form-row">
            <div className="field">
              <label htmlFor="date">Date</label>
              <input id="date" name="date" type="date" required defaultValue={start.date} />
            </div>
            <div className="field">
              <label htmlFor="startTime">Starts</label>
              <input id="startTime" name="startTime" type="time" required defaultValue={start.time} />
            </div>
            <div className="field">
              <label htmlFor="endTime">Ends <span className="muted">(optional)</span></label>
              <input id="endTime" name="endTime" type="time" defaultValue={end} />
            </div>
          </div>
          <TimezoneSelect value={tz} />
        </fieldset>
        <LocationFields v={session ?? {}} />
      </div>

      <div className="card">
        <div className="form-row">
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={session?.status ?? "PUBLISHED"}>
              {Object.entries(STATUSES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <span className="hint">Drafts are hidden from the site. Moving a published class marks it as rescheduled.</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="statusNote">Note shown with the class <span className="muted">(optional)</span></label>
          <input id="statusNote" name="statusNote" type="text" defaultValue={session?.statusNote ?? ""} placeholder="e.g. No class this week because of the holiday" />
        </div>
        <label className="check">
          <input type="checkbox" name="notify" defaultChecked={!isNew && session?.status !== "DRAFT"} />
          Email subscribers about this {isNew ? "new class" : "change"}
        </label>
      </div>
    </AdminForm>
  );
}
