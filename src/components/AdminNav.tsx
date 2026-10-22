"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/recordings", label: "Recordings" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/rsvps", label: "Attendees" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/outbox", label: "Sent emails" },
  { href: "/admin/settings", label: "Site settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href) || (l.href === "/admin/classes" && path.startsWith("/admin/series"));
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>{l.label}</Link>
        );
      })}
    </nav>
  );
}
