// TrueLink AI Weekly distribution.
// Substack is the source of truth: when Josh publishes a post there, the hourly
// poll picks it up from the public RSS feed and emails it to everyone on the
// website list who isn't already a Substack subscriber.
import { XMLParser } from "npm:fast-xml-parser@4.5.0";
import { admin, getProfile, getSetting, requireAdmin, type BusinessProfile } from "./db.ts";
import { esc, layout, unsubscribeUrl } from "./email.ts";
import { json, preflight } from "./http.ts";

const FROM = "Josh from TrueLink AI Weekly <info@truelinksolutions.com>";
const BATCH = 100;

type Issue = {
  id: string; guid: string; title: string; subtitle: string | null; url: string | null;
  html: string; status: string; published_at: string | null;
};

// ---------- Substack feed ----------

async function fetchFeed(profile: BusinessProfile) {
  const base = profile.substack_url.replace(/\/$/, "");
  const res = await fetch(`${base}/feed`, { headers: { "User-Agent": "TrueLinkHQ/1.0" } });
  if (!res.ok) throw new Error(`Substack feed returned ${res.status}`);
  const xml = await res.text();
  const doc = new XMLParser({ ignoreAttributes: true }).parse(xml);
  const raw = doc?.rss?.channel?.item ?? [];
  const items = Array.isArray(raw) ? raw : [raw];
  return items.map((it: Record<string, unknown>) => ({
    guid: String((it.guid as string) ?? it.link ?? ""),
    title: String(it.title ?? "").trim(),
    subtitle: it.description ? String(it.description).trim() : null,
    url: it.link ? String(it.link) : null,
    html: String(it["content:encoded"] ?? ""),
    published_at: it.pubDate ? new Date(String(it.pubDate)).toISOString() : null,
  })).filter((i) => i.guid && i.title && i.html);
}

/** Saves any new posts (published after the start date) as issues. Returns how many were new. */
async function importFeed(profile: BusinessProfile): Promise<number> {
  const start = new Date(profile.newsletter_start_at).getTime();
  const items = (await fetchFeed(profile)).filter((i) => i.published_at && new Date(i.published_at).getTime() >= start);
  if (!items.length) return 0;
  const { data: existing } = await admin.from("newsletter_issues").select("guid").in("guid", items.map((i) => i.guid));
  const known = new Set((existing ?? []).map((r) => r.guid));
  const fresh = items.filter((i) => !known.has(i.guid));
  if (fresh.length) await admin.from("newsletter_issues").insert(fresh.map((i) => ({ ...i, status: "ready" })));
  return fresh.length;
}

// ---------- Email rendering ----------

const STYLE: Record<string, string> = {
  h1: "font-size:24px;line-height:1.3;margin:0 0 8px 0;color:#081b30;",
  h2: "font-size:20px;line-height:1.35;margin:28px 0 10px 0;color:#081b30;",
  h3: "font-size:17px;line-height:1.4;margin:22px 0 8px 0;color:#081b30;",
  p: "margin:0 0 14px 0;",
  ul: "margin:0 0 14px 0;padding-left:22px;",
  ol: "margin:0 0 14px 0;padding-left:22px;",
  li: "margin:0 0 6px 0;",
  blockquote: "margin:0 0 16px 0;padding:12px 16px;border-left:4px solid #f0821f;background:#fdf3e8;border-radius:6px;color:#1f2937;",
  a: "color:#123a66;",
  img: "max-width:100%;height:auto;border-radius:8px;",
  figure: "margin:0 0 16px 0;",
  figcaption: "font-size:13px;color:#64748b;margin-top:6px;",
};

export function cleanSubstackHtml(html: string): string {
  let h = html
    // Substack's own "Subscribe" box: these readers are already subscribed by email.
    .replace(/<div class="subscription-widget-wrap[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/<input[^>]*>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<div>\s*<hr\s*\/?>\s*<\/div>/gi, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">')
    .replace(/<p>\s*<\/p>/gi, "");
  for (const [tag, css] of Object.entries(STYLE)) {
    h = h.replace(new RegExp(`<${tag}(\\s|>)`, "gi"), `<${tag} style="${css}"$1`);
  }
  return h;
}

function issueEmail(issue: Issue, profile: BusinessProfile, unsubscribeToken: string): string {
  const readOnline = issue.url
    ? `<p style="margin:0 0 20px 0;font-size:13px;color:#64748b;">Easier to read in a browser? <a href="${issue.url}" style="color:#123a66;">View this issue online</a></p>`
    : "";
  const body = `${readOnline}
<h1 style="${STYLE.h1}">${esc(issue.title)}</h1>
${issue.subtitle ? `<p style="margin:0 0 20px 0;font-size:17px;color:#475569;">${esc(issue.subtitle)}</p>` : ""}
${cleanSubstackHtml(issue.html)}`;
  return layout({
    preheader: issue.subtitle ?? issue.title,
    body,
    profile,
    unsubscribeToken,
    reason: "You're receiving TrueLink AI Weekly because you signed up at truelinksolutions.com.",
  });
}

// ---------- Sending ----------

async function resendKey(): Promise<string> {
  const key = Deno.env.get("RESEND_API_KEY") || await getSetting("resend_api_key");
  if (!key) throw new Error("Email sending key is missing");
  return key;
}

async function postBatch(key: string, emails: unknown[], idempotencyKey: string) {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(emails),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/** Sends (or resumes sending) one issue to everyone in the audience who hasn't received it yet. */
async function sendIssue(issue: Issue, profile: BusinessProfile) {
  const key = await resendKey();
  await admin.from("newsletter_issues").update({ status: "sending", last_error: null }).eq("id", issue.id);

  const [{ data: audience }, { data: done }] = await Promise.all([
    admin.from("newsletter_audience").select("id,name,email,unsubscribe_token").limit(5000),
    admin.from("newsletter_sends").select("contact_id").eq("issue_id", issue.id),
  ]);
  const already = new Set((done ?? []).map((d) => d.contact_id));
  const todo = (audience ?? []).filter((c) => !already.has(c.id));

  let sent = 0;
  try {
    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      await postBatch(key, chunk.map((c) => ({
        from: FROM,
        to: [c.email],
        reply_to: "info@truelinksolutions.com",
        subject: issue.title,
        html: issueEmail(issue, profile, c.unsubscribe_token),
        headers: { "List-Unsubscribe": `<${unsubscribeUrl(c.unsubscribe_token)}>` },
      })), `${issue.id}-${chunk[0].id}-${chunk.length}`);
      await admin.from("newsletter_sends").insert(chunk.map((c) => ({ issue_id: issue.id, contact_id: c.id })));
      sent += chunk.length;
    }
  } catch (e) {
    // Most likely the daily email limit. Leave it as "sending"; the next hourly run picks up where it stopped.
    const msg = (e as Error).message;
    await admin.from("newsletter_issues").update({ last_error: msg }).eq("id", issue.id);
    const { count } = await admin.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("issue_id", issue.id);
    await admin.from("newsletter_issues").update({ recipient_count: count ?? 0 }).eq("id", issue.id);
    return { sent, finished: false, error: msg };
  }

  const { count } = await admin.from("newsletter_sends").select("*", { count: "exact", head: true }).eq("issue_id", issue.id);
  await admin.from("newsletter_issues")
    .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: count ?? 0 })
    .eq("id", issue.id);
  return { sent, finished: true };
}

async function runPoll(profile: BusinessProfile) {
  const imported = await importFeed(profile);
  const results: unknown[] = [];
  const { data: pending } = await admin.from("newsletter_issues").select("*")
    .in("status", profile.newsletter_auto_send ? ["ready", "sending"] : ["sending"])
    .order("published_at", { ascending: true });
  for (const issue of pending ?? []) results.push({ id: issue.id, ...(await sendIssue(issue, profile)) });
  return { imported, results };
}

// ---------- HTTP ----------

export async function handleNewsletter(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  const path = new URL(req.url).pathname.replace(/\/+$/, "");

  if (path.endsWith("/poll")) {
    const secret = await getSetting("cron_secret");
    if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
    try {
      return json(req, { ok: true, ...(await runPoll(await getProfile())) });
    } catch (e) {
      console.error(e);
      return json(req, { ok: false, error: (e as Error).message }, 500);
    }
  }

  const adminEmail = await requireAdmin(req);
  if (!adminEmail) return json(req, { ok: false, error: "Not authorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const profile = await getProfile();

  try {
    switch (body.action) {
      case "check_now":
        return json(req, { ok: true, ...(await runPoll(profile)) });

      case "send": {
        const { data: issue } = await admin.from("newsletter_issues").select("*").eq("id", body.issue_id).single();
        if (!issue) return json(req, { ok: false, error: "Issue not found" }, 404);
        return json(req, { ok: true, ...(await sendIssue(issue, profile)) });
      }

      case "send_test": {
        const { data: issue } = await admin.from("newsletter_issues").select("*").eq("id", body.issue_id).single();
        if (!issue) return json(req, { ok: false, error: "Issue not found" }, 404);
        await postBatch(await resendKey(), [{
          from: FROM, to: [adminEmail], reply_to: "info@truelinksolutions.com",
          subject: `[Test] ${issue.title}`,
          html: issueEmail(issue, profile, "00000000-0000-0000-0000-000000000000"),
        }], `test-${issue.id}-${Date.now()}`);
        return json(req, { ok: true, to: adminEmail });
      }

      case "skip":
        await admin.from("newsletter_issues").update({ status: "skipped" }).eq("id", body.issue_id).eq("status", "ready");
        return json(req, { ok: true });

      case "import_substack": {
        const emails = [...new Set((Array.isArray(body.emails) ? body.emails : [])
          .map((e: unknown) => String(e).trim().toLowerCase())
          .filter((e: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(e)))];
        if (body.replace) await admin.from("substack_subscribers").delete().neq("email", "");
        for (let i = 0; i < emails.length; i += 500) {
          await admin.from("substack_subscribers").upsert(emails.slice(i, i + 500).map((email) => ({ email })), { onConflict: "email" });
        }
        const { count } = await admin.from("substack_subscribers").select("*", { count: "exact", head: true });
        return json(req, { ok: true, imported: emails.length, total: count ?? 0 });
      }

      default:
        return json(req, { ok: false, error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json(req, { ok: false, error: (e as Error).message }, 500);
  }
}
