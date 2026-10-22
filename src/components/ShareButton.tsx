"use client";

import { useEffect, useState } from "react";

export function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Fall through to copying when the share sheet is dismissed or unavailable.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button type="button" className="btn btn-quiet btn-sm" onClick={share}>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function WhatsAppShare({ path, title }: { path: string; title: string }) {
  const [href, setHref] = useState(`https://wa.me/?text=${encodeURIComponent(title)}`);
  useEffect(() => {
    setHref(`https://wa.me/?text=${encodeURIComponent(`${title} ${new URL(path, window.location.origin)}`)}`);
  }, [path, title]);
  return (
    <a className="btn btn-quiet btn-sm" href={href} target="_blank" rel="noopener noreferrer">
      WhatsApp
    </a>
  );
}
