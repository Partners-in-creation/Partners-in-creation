"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75];

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Accessible audio player. Starting one player pauses any other on the page. */
export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== audio.current) audio.current?.pause();
    };
    window.addEventListener("pic:play", onOther);
    return () => window.removeEventListener("pic:play", onOther);
  }, []);

  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      window.dispatchEvent(new CustomEvent("pic:play", { detail: a }));
      try {
        await a.play();
      } catch {
        setError(true);
      }
    } else {
      a.pause();
    }
  };

  const skip = (delta: number) => {
    const a = audio.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audio.current) audio.current.playbackRate = next;
  };

  return (
    <div className="player">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onError={() => setError(true)}
      />
      <button type="button" className="player-btn" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} ${title}`}>
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="2" width="4" height="14" rx="1" fill="currentColor" /><rect x="11" y="2" width="4" height="14" rx="1" fill="currentColor" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 2.5v13a.5.5 0 0 0 .76.43l10.5-6.5a.5.5 0 0 0 0-.86L4.76 2.07A.5.5 0 0 0 4 2.5z" fill="currentColor" /></svg>
        )}
      </button>
      <div className="player-track">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(time, duration || 0)}
          onChange={(e) => {
            const a = audio.current;
            if (a) a.currentTime = Number(e.target.value);
            setTime(Number(e.target.value));
          }}
          aria-label={`Seek ${title}`}
          aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
        />
        <div className="player-times">
          <span>{fmt(time)}</span>
          <span className="player-tools">
            <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds">−15</button>
            <button type="button" onClick={() => skip(30)} aria-label="Forward 30 seconds">+30</button>
            <button type="button" onClick={cycleSpeed} aria-label={`Playback speed ${speed}x`}>{speed}×</button>
          </span>
          <span>{duration ? fmt(duration) : "--:--"}</span>
        </div>
        {error && (
          <span className="small muted">
            This audio couldn&apos;t be played here. <a href={src} target="_blank" rel="noopener noreferrer">Open the file</a>
          </span>
        )}
      </div>
    </div>
  );
}
