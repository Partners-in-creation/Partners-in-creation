"use client";

import { useActionState } from "react";
import { requestToAttend, subscribe, type FormState } from "@/app/actions";

function Status({ state }: { state: FormState }) {
  if (state.error) return <div className="notice notice-error" role="alert">{state.error}</div>;
  if (state.message) return <div className="notice notice-ok" role="status">{state.message}</div>;
  return null;
}

const Honeypot = () => (
  <div className="hp" aria-hidden="true">
    <label>Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
  </div>
);

/** One-line subscribe form for the homepage band. */
export function QuickSubscribe() {
  const [state, action, pending] = useActionState(subscribe, {});
  if (state.ok) return <Status state={state} />;
  return (
    <form action={action}>
      <Status state={state} />
      <Honeypot />
      <div className="inline-form">
        <label className="sr-only" htmlFor="qs-email">Email address</label>
        <input id="qs-email" type="email" name="email" required placeholder="Your email address" autoComplete="email" />
        <button className="btn btn-gold" disabled={pending}>{pending ? "Subscribing…" : "Subscribe"}</button>
      </div>
      <p className="hint" style={{ marginTop: 10 }}>Class reminders and announcements. Unsubscribe anytime.</p>
    </form>
  );
}

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribe, {});
  if (state.ok) return <Status state={state} />;
  return (
    <form action={action}>
      <Status state={state} />
      <Honeypot />
      <input type="hidden" name="prefs" value="1" />
      <div className="field">
        <label htmlFor="s-name">Name <span className="muted">(optional)</span></label>
        <input id="s-name" type="text" name="name" autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="s-email">Email address</label>
        <input id="s-email" type="email" name="email" required autoComplete="email" />
      </div>
      <div className="field">
        <span className="label-text">Send me</span>
        <label className="check"><input type="checkbox" name="reminders" defaultChecked /> Class reminders and schedule changes</label>
        <label className="check"><input type="checkbox" name="announcements" defaultChecked /> Announcements and community news</label>
      </div>
      <button className="btn" disabled={pending}>{pending ? "Subscribing…" : "Subscribe"}</button>
    </form>
  );
}

export function AttendForm({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(requestToAttend, {});
  if (state.ok) return <Status state={state} />;
  return (
    <form action={action}>
      <Status state={state} />
      <Honeypot />
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="form-row">
        <div className="field">
          <label htmlFor="a-name">Name</label>
          <input id="a-name" type="text" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="a-email">Email address</label>
          <input id="a-email" type="email" name="email" required autoComplete="email" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="a-note">Note <span className="muted">(optional)</span></label>
        <textarea id="a-note" name="note" rows={3} style={{ minHeight: 80 }} />
      </div>
      <button className="btn" disabled={pending}>{pending ? "Sending…" : "Ask to attend"}</button>
    </form>
  );
}
