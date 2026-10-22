import { COMMON_TIMEZONES } from "@/lib/time";
import { FORMATS, VISIBILITY } from "@/lib/classes";

type Loc = {
  format?: string;
  venueName?: string;
  address?: string;
  directionsUrl?: string;
  meetingUrl?: string;
  locationVisibility?: string;
};

export function TimezoneSelect({ value }: { value: string }) {
  const zones = COMMON_TIMEZONES.includes(value) ? COMMON_TIMEZONES : [value, ...COMMON_TIMEZONES];
  return (
    <div className="field">
      <label htmlFor="timezone">Time zone</label>
      <select id="timezone" name="timezone" defaultValue={value}>
        {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}

/** Format, venue and address privacy fields, shared by single classes and weekly schedules. */
export function LocationFields({ v }: { v: Loc }) {
  return (
    <fieldset>
      <legend>Where</legend>
      <div className="field">
        <label htmlFor="format">Format</label>
        <select id="format" name="format" defaultValue={v.format ?? "IN_PERSON"}>
          {Object.entries(FORMATS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="venueName">Venue name</label>
        <input id="venueName" name="venueName" type="text" defaultValue={v.venueName ?? ""} placeholder="e.g. Community hall" />
        <span className="hint">Always shown publicly, so don&apos;t put a family name or home address here.</span>
      </div>
      <div className="field">
        <label htmlFor="address">Address</label>
        <textarea id="address" name="address" rows={2} style={{ minHeight: 70 }} defaultValue={v.address ?? ""} />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="directionsUrl">Directions link <span className="muted">(optional)</span></label>
          <input id="directionsUrl" name="directionsUrl" type="url" defaultValue={v.directionsUrl ?? ""} placeholder="https://maps.google.com/…" />
        </div>
        <div className="field">
          <label htmlFor="meetingUrl">Online meeting link <span className="muted">(optional)</span></label>
          <input id="meetingUrl" name="meetingUrl" type="url" defaultValue={v.meetingUrl ?? ""} placeholder="https://zoom.us/j/…" />
        </div>
      </div>
      <div className="field">
        <span className="label-text">Who can see the address and meeting link?</span>
        {Object.entries(VISIBILITY).map(([k, label]) => (
          <label key={k} className="check">
            <input type="radio" name="locationVisibility" value={k} defaultChecked={(v.locationVisibility ?? "PRIVATE") === k} />
            {label}
          </label>
        ))}
        <span className="hint">Private is the default, so a home address is never shown unless you choose to.</span>
      </div>
    </fieldset>
  );
}
