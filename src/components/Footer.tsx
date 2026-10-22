import Link from "next/link";
import type { Settings } from "@/lib/settings";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="wordmark" style={{ color: "var(--ivory)" }}>{settings.siteName}</div>
            <p style={{ marginTop: 10, maxWidth: 360 }}>{settings.tagline}</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link href="/classes">Classes &amp; schedule</Link></li>
              <li><Link href="/recordings">Recordings</Link></li>
              <li><Link href="/updates">Updates</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/subscribe">Subscribe</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              {settings.contactEmail && <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>}
              {settings.contactPhone && <li><a href={`tel:${settings.contactPhone.replace(/[^+\d]/g, "")}`}>{settings.contactPhone}</a></li>}
              {settings.whatsappUrl && <li><a href={settings.whatsappUrl} rel="noopener noreferrer" target="_blank">Join the WhatsApp group</a></li>}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {settings.siteName}</span>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
