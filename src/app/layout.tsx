import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "./globals.css";
import { getSettings, siteUrl } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.siteName, template: `%s · ${s.siteName}` },
    description: s.tagline,
    openGraph: { title: s.siteName, description: s.tagline, siteName: s.siteName, type: "website" },
  };
}

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#1b2a41", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
