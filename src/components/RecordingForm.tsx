import type { Recording } from "@prisma/client";
import { saveRecording } from "@/app/admin/actions";
import { AdminForm } from "./AdminForm";
import { AudioUpload } from "./AudioUpload";

export function RecordingForm({ rec, topics, today }: { rec?: Recording | null; topics: string[]; today: string }) {
  return (
    <AdminForm action={saveRecording} submitLabel={rec ? "Save changes" : "Add recording"}>
      {rec && <input type="hidden" name="id" value={rec.id} />}
      <div className="card">
        <AudioUpload initial={rec ?? {}} />
      </div>
      <div className="card">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required defaultValue={rec?.title ?? ""} />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="recordedOn">Date of the class</label>
            <input id="recordedOn" name="recordedOn" type="date" required defaultValue={rec ? rec.recordedOn.toISOString().slice(0, 10) : today} />
          </div>
          <div className="field">
            <label htmlFor="topic">Topic</label>
            <input id="topic" name="topic" type="text" list="topics" defaultValue={rec?.topic ?? ""} placeholder="e.g. Parsha" />
            <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">Description <span className="muted">(optional)</span></label>
          <textarea id="description" name="description" defaultValue={rec?.description ?? ""} />
        </div>
        {rec && (
          <div className="field">
            <label htmlFor="slug">Link name</label>
            <input id="slug" name="slug" type="text" defaultValue={rec.slug} />
            <span className="hint">The end of this recording&apos;s web address. Changing it breaks links already shared.</span>
          </div>
        )}
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={rec?.published ?? true} /> Show on the site
        </label>
      </div>
    </AdminForm>
  );
}
