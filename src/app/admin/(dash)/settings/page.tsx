import { getSettings } from "@/lib/settings";
import { saveSettings } from "../../actions";
import { AdminForm } from "@/components/AdminForm";
import { TimezoneSelect } from "@/components/ClassFields";

export default async function SettingsPage() {
  const s = await getSettings();
  const text = (name: keyof typeof s, label: string, hint?: string, type = "text") => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={String(s[name] ?? "")} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
  const area = (name: keyof typeof s, label: string, rows = 5, hint?: string) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={rows} defaultValue={String(s[name] ?? "")} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
  return (
    <>
      <h1>Site settings</h1>
      <p className="muted">Text that starts with “[Placeholder]” is shown in grey italics until you replace it.</p>
      <AdminForm action={saveSettings}>
        <div className="card">
          <h2 style={{ fontSize: "1.3rem" }}>Homepage</h2>
          {text("siteName", "Site name")}
          {text("tagline", "Tagline", "Shown above the name and in link previews.")}
          {area("welcomeMessage", "Welcome message", 3)}
          {text("scheduleSummary", "Schedule summary", "e.g. Classes meet Sunday and Wednesday evenings.")}
        </div>
        <div className="card">
          <h2 style={{ fontSize: "1.3rem" }}>About</h2>
          {text("aboutTitle", "About heading")}
          {area("aboutText", "About Aviezer", 7)}
          {area("communityText", "About the community", 5)}
          {text("aboutPhotoUrl", "Photo link (optional)", "A link to a photo to show on the About page.", "url")}
        </div>
        <div className="card">
          <h2 style={{ fontSize: "1.3rem" }}>Contact</h2>
          {text("contactEmail", "Contact email", "Use an address made for the site, not a personal one.", "email")}
          {text("contactPhone", "Contact phone (optional)")}
          {text("whatsappUrl", "WhatsApp group invite link (optional)", "Shown in the footer and About page when filled in.", "url")}
          <TimezoneSelect value={s.timezone} />
        </div>
      </AdminForm>
    </>
  );
}
