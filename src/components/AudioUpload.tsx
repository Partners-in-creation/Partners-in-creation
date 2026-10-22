"use client";

import { useRef, useState } from "react";

type Initial = { storageKey?: string | null; externalUrl?: string | null; mimeType?: string; sizeBytes?: number | null; durationSec?: number | null };

/** Upload an audio file (with progress) or paste a link. Fills hidden fields for the recording form. */
export function AudioUpload({ initial }: { initial: Initial }) {
  const [mode, setMode] = useState<"upload" | "link">(initial.externalUrl && !initial.storageKey ? "link" : "upload");
  const [key, setKey] = useState(initial.storageKey ?? "");
  const [mime, setMime] = useState(initial.mimeType ?? "");
  const [size, setSize] = useState(initial.sizeBytes ? String(initial.sizeBytes) : "");
  const [duration, setDuration] = useState(initial.durationSec ? String(initial.durationSec) : "");
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState(initial.storageKey ? "An audio file is attached. Choose a new file to replace it." : "");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const readDuration = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration)) setDuration(String(Math.round(a.duration)));
      URL.revokeObjectURL(url);
    };
    a.src = url;
  };

  const upload = async (file: File) => {
    setError("");
    setProgress(0);
    setStatus(`Uploading ${file.name}…`);
    readDuration(file);
    try {
      const res = await fetch("/api/admin/upload-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type }),
      });
      const target = await res.json();
      if (!res.ok) throw new Error(target.error || "Could not start the upload");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", target.url);
        xhr.setRequestHeader("Content-Type", target.contentType);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
        xhr.send(file);
      });
      setKey(target.key);
      setMime(target.contentType);
      setSize(String(file.size));
      setStatus(`Uploaded ${file.name}. Remember to save.`);
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStatus("");
      setProgress(null);
    }
  };

  return (
    <div className="field">
      <span className="label-text">Audio</span>
      <div className="tabs" role="group">
        <button type="button" aria-pressed={mode === "upload"} onClick={() => setMode("upload")}>Upload a file</button>
        <button type="button" aria-pressed={mode === "link"} onClick={() => setMode("link")}>Paste a link</button>
      </div>
      <input type="hidden" name="storageKey" value={mode === "upload" ? key : ""} />
      <input type="hidden" name="mimeType" value={mime} />
      <input type="hidden" name="sizeBytes" value={mode === "upload" ? size : ""} />
      <input type="hidden" name="durationSec" value={duration} />
      {mode === "upload" ? (
        <div className="upload-box">
          <input
            ref={input}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac"
            className="sr-only"
            id="audio-file"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <label htmlFor="audio-file" className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>Choose audio file</label>
          {status && <p className="small" style={{ margin: "10px 0 0" }}>{status}</p>}
          {progress !== null && progress < 100 && (
            <div className="progress" aria-label="Upload progress"><div style={{ width: `${progress}%` }} /></div>
          )}
          {error && <p className="small" style={{ color: "var(--danger)", margin: "10px 0 0" }}>{error}</p>}
        </div>
      ) : (
        <>
          <input type="url" name="externalUrl" defaultValue={initial.externalUrl ?? ""} placeholder="https://…/class.mp3" />
          <span className="hint">
            Direct links to audio files, Dropbox share links and Google Drive file links play right on the site. Other links
            (for example a podcast page) show a “Listen” button instead.
          </span>
        </>
      )}
      {mode === "link" && (
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="durationMin">Length in minutes <span className="muted">(optional)</span></label>
          <input
            id="durationMin"
            type="number"
            min={0}
            defaultValue={duration ? Math.round(Number(duration) / 60) : ""}
            onChange={(e) => setDuration(e.target.value ? String(Number(e.target.value) * 60) : "")}
          />
        </div>
      )}
    </div>
  );
}
