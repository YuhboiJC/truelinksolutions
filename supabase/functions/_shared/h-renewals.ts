// Daily (pg_cron): re-syncs Hostinger if connected, then emails a renewal digest
// when anything hits 60 / 30 / 14 / 7 / 3 / 1 / 0 days out, or is overdue.
import { admin, getProfile, getSetting, setSetting } from "./db.ts";
import { esc, layout, sendEmail } from "./email.ts";
import { hostingerToken, syncHostinger } from "./hostinger.ts";

const MILESTONES = [60, 30, 14, 7, 3, 1, 0];
const HQ = "https://truelinksolutions.com/hq/#/services";

function daysUntil(d: string): number {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${d}T00:00:00`).getTime() - today.getTime()) / 86400000);
}

export async function runRenewalCheck({ force = false } = {}) {
  const token = await hostingerToken();
  if (token) {
    try {
      await syncHostinger(token);
      await setSetting("hostinger_last_sync", new Date().toISOString());
    } catch (e) {
      console.error("hostinger sync failed", e);
    }
  }

  const horizon = new Date(Date.now() + 61 * 86400000).toISOString().slice(0, 10);
  const { data: rows } = await admin.from("services")
    .select("id,name,category,provider,renews_on,auto_renew,our_cost,account_owner,last_reminded_on,contact:contacts(name,business_name)")
    .neq("status", "cancelled").not("renews_on", "is", null).lte("renews_on", horizon)
    .order("renews_on");

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const items = (rows ?? []).map((r) => ({ ...r, days: daysUntil(r.renews_on!) }));
  const due = items.filter((r) => r.last_reminded_on !== todayStr && (r.days < 0 || MILESTONES.includes(r.days)));
  if (!force && due.length === 0) return { sent: false, due: 0 };
  if (force && items.length === 0) return { sent: false, due: 0 };

  const list = force ? items : due;
  const profile = await getProfile();
  const rowsHtml = list.map((r) => {
    const who = (r.contact as { business_name?: string; name?: string } | null);
    const owner = who?.business_name || who?.name || "TrueLink (internal)";
    const when = r.days < 0 ? `<b style="color:#e11d48">${-r.days} days overdue</b>` : r.days === 0 ? "<b>today</b>" : `in ${r.days} days`;
    const action = r.auto_renew && r.account_owner === "truelink" ? "Auto-renews" : "Action needed";
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;"><b>${esc(r.name)}</b><br><span style="color:#64748b;font-size:13px;">${esc(owner)} · ${esc(r.provider ?? "")}${r.our_cost != null ? ` · $${r.our_cost}` : ""}</span></td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px;">${when}<br><span style="color:#64748b;font-size:12px;">${action}</span></td></tr>`;
  }).join("");

  await sendEmail({
    to: profile.notify_email,
    subject: `Renewals coming up: ${list.length} item${list.length === 1 ? "" : "s"}`,
    html: layout({
      preheader: "Hosting, domains and services renewing soon",
      profile,
      reason: "You're receiving this because you're an admin of TrueLink HQ.",
      body: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:700;">Upcoming renewals</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
<p style="margin:20px 0;"><a href="${HQ}" style="background:#f0821f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Open Services in HQ</a></p>`,
    }),
  });
  if (due.length) await admin.from("services").update({ last_reminded_on: todayStr }).in("id", due.map((r) => r.id));
  return { sent: true, due: list.length };
}

export async function handleRenewals(req: Request): Promise<Response> {
  const secret = await getSetting("cron_secret");
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false }), { status: 403 });
  }
  try {
    return new Response(JSON.stringify({ ok: true, ...(await runRenewalCheck()) }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500 });
  }
}
