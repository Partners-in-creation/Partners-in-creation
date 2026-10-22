import type { Announcement } from "@prisma/client";
import { saveAnnouncement } from "@/app/admin/actions";
import { AdminForm } from "./AdminForm";
import { CATEGORIES } from "./AnnouncementItem";

export function AnnouncementForm({ a }: { a?: Announcement | null }) {
  return (
    <AdminForm action={saveAnnouncement} submitLabel={a ? "Save changes" : "Post update"}>
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="card">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required defaultValue={a?.title ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="category">Type</label>
          <select id="category" name="category" defaultValue={a?.category ?? "ANNOUNCEMENT"}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="body">Message</label>
          <textarea id="body" name="body" rows={8} required defaultValue={a?.body ?? ""} />
          <span className="hint">Line breaks are kept as you type them.</span>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <label className="check"><input type="checkbox" name="published" defaultChecked={a?.published ?? true} /> Show on the site</label>
          <label className="check"><input type="checkbox" name="pinned" defaultChecked={a?.pinned ?? false} /> Pin to the top</label>
          <label className="check">
            <input type="checkbox" name="notify" defaultChecked={!a} />
            {a?.notifiedAt ? "Email subscribers again" : "Email this to subscribers"}
          </label>
        </div>
      </div>
    </AdminForm>
  );
}
