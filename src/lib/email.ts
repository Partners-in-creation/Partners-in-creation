import "server-only";
import nodemailer from "nodemailer";
import { db } from "./db";
import { getSettings, siteUrl } from "./settings";

// Email goes out through SMTP when SMTP_URL is set (any provider: Postmark,
// Resend, SendGrid, Mailgun, Amazon SES...). Without it, messages are only
// recorded in the Outbox, which the admin can review in the dashboard.
//
// The sender must be an address dedicated to this site (EMAIL_FROM). It is a
// placeholder until one is set up.

const DEFAULT_FROM = "Partners In Creation <notifications@example.com>";

let transport: nodemailer.Transporter | null | undefined;
function getTransport() {
  if (transport === undefined) {
    transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;
  }
  return transport;
}

export function emailConfigured(): boolean {
  return !!process.env.SMTP_URL;
}

export type Email = { to: string; subject: string; text: string; unsubscribeToken?: string };

export async function sendEmail(email: Email) {
  const settings = await getSettings();
  let text = email.text.trim();
  const headers: Record<string, string> = {};
  if (email.unsubscribeToken) {
    const manage = `${siteUrl()}/subscribe/manage?token=${email.unsubscribeToken}`;
    const unsub = `${siteUrl()}/subscribe/unsubscribe?token=${email.unsubscribeToken}`;
    text += `\n\n—\n${settings.siteName}\nManage your emails: ${manage}\nUnsubscribe: ${unsub}`;
    headers["List-Unsubscribe"] = `<${siteUrl()}/m/unsubscribe?token=${email.unsubscribeToken}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  } else {
    text += `\n\n—\n${settings.siteName}\n${siteUrl()}`;
  }

  const record = await db.outboxEmail.create({ data: { to: email.to, subject: email.subject, text } });
  const t = getTransport();
  if (!t) return;
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      replyTo: settings.contactEmail || undefined,
      to: email.to,
      subject: email.subject,
      text,
      headers,
    });
    await db.outboxEmail.update({ where: { id: record.id }, data: { status: "SENT" } });
  } catch (err) {
    await db.outboxEmail.update({
      where: { id: record.id },
      data: { status: "FAILED", error: String(err instanceof Error ? err.message : err).slice(0, 500) },
    });
  }
}
