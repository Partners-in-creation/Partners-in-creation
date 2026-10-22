"use client";

import { useActionState } from "react";
import type { AdminState } from "@/app/admin/actions";

/** Wraps an admin server action and shows its error or success message. */
export function AdminForm({
  action,
  children,
  className = "admin-form",
  submitLabel = "Save",
}: {
  action: (prev: AdminState, form: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {state.error && <div className="notice notice-error" role="alert">{state.error}</div>}
      {state.message && <div className="notice notice-ok" role="status">{state.message}</div>}
      {children}
      <button className="btn" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}

/** A button that asks for confirmation before submitting its form. */
export function ConfirmButton({ children, message, className = "btn btn-quiet btn-sm" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
