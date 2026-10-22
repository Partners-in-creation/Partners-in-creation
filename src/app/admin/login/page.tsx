import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { login } from "../actions";
import { AdminForm } from "@/components/AdminForm";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="login-wrap">
      <div className="card">
        <span className="eyebrow">Partners In Creation</span>
        <h1 style={{ fontSize: "2rem" }}>Admin sign in</h1>
        <AdminForm action={login} className="" submitLabel="Sign in">
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" name="password" required autoComplete="current-password" autoFocus />
          </div>
        </AdminForm>
      </div>
    </div>
  );
}
