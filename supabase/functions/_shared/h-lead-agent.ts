// HQ actions for the AI lead finder.
import { admin, getSetting, requireAdmin, setSetting } from "./db.ts";
import { json, preflight } from "./http.ts";
import { anthropicKey, background, tick } from "./lead-agent.ts";

const NEEDS = ["Website", "Social media management", "Automation", "AI chat assistant", "Email newsletter", "Online giving", "Livestream", "Online booking", "Google reviews", "AI phone receptionist"];
const OUTREACH = ["email", "sms", "call"];

export async function handleLeadTick(req: Request): Promise<Response> {
  const secret = await getSetting("cron_secret");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
  background(tick());
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}

export async function handleLeadAgent(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  const who = await requireAdmin(req);
  if (!who) return json(req, { ok: false, error: "Not authorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "status") {
      return json(req, { ok: true, connected: !!(await anthropicKey()) });
    }

    if (action === "save_key") {
      const key = String(body.key ?? "").trim();
      if (!/^sk-ant-[A-Za-z0-9_\-]{20,}$/.test(key)) return json(req, { ok: false, error: "That doesn't look like an Anthropic API key (it starts with sk-ant-)." }, 422);
      const res = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
      if (!res.ok) return json(req, { ok: false, error: "Anthropic rejected that key. Copy it again from console.anthropic.com → API keys." }, 422);
      await setSetting("anthropic_api_key", key);
      return json(req, { ok: true });
    }

    if (!(await anthropicKey())) {
      return json(req, { ok: false, error: "Add your Anthropic API key in Settings first (it powers the AI lead finder)." }, 400);
    }

    if (action === "start") {
      const audience = body.audience === "church" ? "church" : "business";
      const requested = Math.max(1, Math.min(25, Math.round(Number(body.count) || 5)));
      const needs = (Array.isArray(body.needs) ? body.needs : []).map(String).filter((n: string) => NEEDS.includes(n));
      const outreach = (Array.isArray(body.outreach) ? body.outreach : []).map(String).filter((o: string) => OUTREACH.includes(o));
      if (!outreach.length) return json(req, { ok: false, error: "Pick at least one outreach method." }, 422);
      const { data: job, error } = await admin.from("lead_jobs").insert({
        audience,
        requested,
        needs,
        outreach,
        area: String(body.area ?? "").trim().slice(0, 120) || "Southwest Florida (Port Charlotte, Punta Gorda, North Port, Venice, Englewood, Fort Myers, Cape Coral)",
        niche: String(body.niche ?? "").trim().slice(0, 120) || null,
        notes: String(body.notes ?? "").trim().slice(0, 500) || null,
        created_by: who,
      }).select().single();
      if (error) throw error;
      background(tick());
      return json(req, { ok: true, job });
    }

    if (action === "research_contact") {
      const contactId = String(body.contact_id ?? "");
      const { data: existing } = await admin.from("lead_research").select("id,status").eq("contact_id", contactId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing && ["pending", "researching"].includes(existing.status)) {
        return json(req, { ok: true, research: existing });
      }
      const { data: row, error } = await admin.from("lead_research").insert({ contact_id: contactId }).select().single();
      if (error) throw error;
      background(tick());
      return json(req, { ok: true, research: row });
    }

    if (action === "retry") {
      await admin.from("lead_research").update({ status: "pending", attempts: 0, error: null }).eq("id", String(body.research_id ?? ""));
      background(tick());
      return json(req, { ok: true });
    }

    if (action === "kick") {
      background(tick());
      return json(req, { ok: true });
    }

    return json(req, { ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { ok: false, error: (e as Error).message }, 500);
  }
}
