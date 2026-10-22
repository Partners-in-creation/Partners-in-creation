import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <Header siteName={settings.siteName} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
