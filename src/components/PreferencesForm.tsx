"use client";

import { useActionState } from "react";
import { updatePreferences } from "@/app/actions";

export function PreferencesForm(props: { token: string; name: string; reminders: boolean; announcements: boolean }) {
  const [state, action, pending] = useActionState(updatePreferences, {});
  return (
    <form action={action}>
      {state.error && <div className="notice notice-error" role="alert">{state.error}</div>}
      {state.message && <div className="notice notice-ok" role="status">{state.message}</div>}
      <input type="hidden" name="token" value={props.token} />
      <div className="field">
        <label htmlFor="p-name">Name</label>
        <input id="p-name" type="text" name="name" defaultValue={props.name} autoComplete="name" />
      </div>
      <div className="field">
        <span className="label-text">Send me</span>
        <label className="check"><input type="checkbox" name="reminders" defaultChecked={props.reminders} /> Class reminders and schedule changes</label>
        <label className="check"><input type="checkbox" name="announcements" defaultChecked={props.announcements} /> Announcements and community news</label>
        <span className="hint">Untick both to unsubscribe from everything.</span>
      </div>
      <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save preferences"}</button>
    </form>
  );
}
