import type { ClassSeries } from "@prisma/client";
import { saveSeries } from "@/app/admin/actions";
import { AdminForm } from "./AdminForm";
import { LocationFields, TimezoneSelect } from "./ClassFields";
import { WEEKDAYS } from "@/lib/time";
import { seriesDays } from "@/lib/series";

export function SeriesForm({ series, defaultTimezone, today }: { series?: ClassSeries | null; defaultTimezone: string; today: string }) {
  const days = series ? seriesDays(series) : [];
  return (
    <AdminForm action={saveSeries} submitLabel={series ? "Save schedule" : "Create schedule"}>
      {series && <input type="hidden" name="id" value={series.id} />}
      <div className="card">
        <div className="field">
          <label htmlFor="title">Class title</label>
          <input id="title" name="title" type="text" required defaultValue={series?.title ?? ""} placeholder="e.g. Weekly Torah class" />
        </div>
        <div className="field">
          <label htmlFor="description">Description <span className="muted">(optional)</span></label>
          <textarea id="description" name="description" defaultValue={series?.description ?? ""} />
        </div>
      </div>
      <div className="card">
        <fieldset>
          <legend>When</legend>
          <div className="field">
            <span className="label-text">Days</span>
            <div className="days">
              {WEEKDAYS.map((d, i) => (
                <label key={d}><input type="checkbox" name="days" value={i} defaultChecked={days.includes(i)} /> {d}</label>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="startTime">Starts</label>
              <input id="startTime" name="startTime" type="time" required defaultValue={series?.startTime ?? "20:00"} />
            </div>
            <div className="field">
              <label htmlFor="endTime">Ends <span className="muted">(optional)</span></label>
              <input id="endTime" name="endTime" type="time" defaultValue={series?.endTime ?? ""} />
            </div>
          </div>
          <TimezoneSelect value={series?.timezone ?? defaultTimezone} />
        </fieldset>
        <LocationFields v={series ?? {}} />
      </div>
      <div className="card">
        <fieldset>
          <legend>Dates on the calendar</legend>
          <div className="form-row">
            <div className="field">
              <label htmlFor="fromDate">Starting from</label>
              <input id="fromDate" name="fromDate" type="date" defaultValue={today} />
            </div>
            <div className="field">
              <label htmlFor="weeks">Add dates for the next</label>
              <select id="weeks" name="weeks" defaultValue={series ? "0" : "12"}>
                <option value="0">Don&apos;t add dates now</option>
                <option value="4">4 weeks</option>
                <option value="8">8 weeks</option>
                <option value="12">12 weeks</option>
                <option value="26">6 months</option>
                <option value="52">1 year</option>
              </select>
            </div>
          </div>
          <p className="hint">Dates that already exist are never duplicated. To skip a holiday, open that date and cancel it.</p>
          {series && (
            <label className="check" style={{ marginBottom: 12 }}>
              <input type="checkbox" name="applyFuture" defaultChecked />
              Apply these changes to upcoming dates I haven&apos;t edited individually
            </label>
          )}
          <label className="check" style={{ marginBottom: 12 }}>
            <input type="checkbox" name="active" defaultChecked={series?.active ?? true} />
            Schedule is active
          </label>
        </fieldset>
      </div>
    </AdminForm>
  );
}
