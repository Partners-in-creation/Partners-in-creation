import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Partners In Creation";
export const dynamic = "force-dynamic";

// The card shown when a link is pasted into WhatsApp or other apps.
export default async function OgImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf8f1",
          color: "#1b2a41",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ width: 80, height: 2, background: "#a8844a", marginBottom: 36 }} />
        <div style={{ fontSize: 84, letterSpacing: 1 }}>{s.siteName}</div>
        <div style={{ fontSize: 34, color: "#6b6f76", marginTop: 20 }}>{s.tagline}</div>
        <div style={{ width: 80, height: 2, background: "#a8844a", marginTop: 36 }} />
      </div>
    ),
    size,
  );
}
