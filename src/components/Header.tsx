"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/classes", label: "Classes" },
  { href: "/recordings", label: "Recordings" },
  { href: "/updates", label: "Updates" },
  { href: "/about", label: "About" },
  { href: "/subscribe", label: "Subscribe" },
];

export function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  // "Partners In Creation" -> "Partners" + " In Creation" in gold.
  const [first, ...rest] = siteName.split(" ");

  return (
    <header className="site-header">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container">
        <Link href="/" className="wordmark">
          {first}
          {rest.length > 0 && <span> {rest.join(" ")}</span>}
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
        <nav id="site-nav" className="nav" data-open={open} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
