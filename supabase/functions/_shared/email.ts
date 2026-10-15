import type { BusinessProfile } from "./db.ts";

const SITE = "https://truelinksolutions.com";
const LOGO = `${SITE}/logo.png`;
const FROM = "Josh from Truelink Solutions <info@truelinksolutions.com>";
const PHONE = "(941) 840-3649";

export function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export function firstName(name: string | null | undefined): string {
  return esc(String(name ?? "").trim().split(/\s+/)[0] ?? "");
}

export function unsubscribeUrl(token: string) {
  return `${SITE}/unsubscribe.html?token=${encodeURIComponent(token)}`;
}

export function layout(opts: {
  preheader: string;
  body: string;
  profile: BusinessProfile;
  unsubscribeToken?: string;
  reason?: string;
}): string {
  const { preheader, body, profile, unsubscribeToken } = opts;
  const address = profile.mailing_address?.trim() || "Port Charlotte, FL";
  const reason = opts.reason ?? "You're receiving this because you signed up at truelinksolutions.com.";
  const unsub = unsubscribeToken
    ? ` <a href="${unsubscribeUrl(unsubscribeToken)}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${esc(profile.business_name)}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#081b30;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
<tr><td style="background:linear-gradient(135deg,#123a66,#f0821f);padding:28px 32px;text-align:center;"><img src="${LOGO}" alt="${esc(profile.business_name)}" style="height:42px;width:auto;display:inline-block;" /></td></tr>
<tr><td style="padding:32px 32px 8px 32px;font-size:16px;line-height:1.65;color:#1f2937;">${body}</td></tr>
<tr><td style="padding:24px 32px 32px 32px;font-size:13px;line-height:1.6;color:#64748b;border-top:1px solid #e2e8f0;">
<p style="margin:16px 0 4px 0;">${esc(profile.business_name)} &middot; ${esc(address)}</p>
<p style="margin:0 0 4px 0;"><a href="mailto:info@truelinksolutions.com" style="color:#123a66;text-decoration:none;">info@truelinksolutions.com</a> &middot; ${PHONE}</p>
<p style="margin:12px 0 0 0;">${reason}${unsub}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  unsubscribeToken?: string;
  replyTo?: string;
}): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const headers: Record<string, string> = {};
  if (opts.unsubscribeToken) headers["List-Unsubscribe"] = `<${unsubscribeUrl(opts.unsubscribeToken)}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo ?? "info@truelinksolutions.com",
      headers,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
