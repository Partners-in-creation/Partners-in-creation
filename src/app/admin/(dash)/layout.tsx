import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { AdminNav } from "@/components/AdminNav";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin" className="wordmark">Partners In Creation</Link>
        <AdminNav />
        <div className="side-foot">
          <Link href="/" target="_blank">View site ↗</Link>
          <form action={logout}><button>Sign out</button></form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
