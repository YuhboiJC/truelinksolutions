// AI lead finder. Uses Claude with web search to (1) find leads that match a
// request and (2) research each one: who runs it, what they're missing, a sales
// script, outreach drafts, a brief and a demo-build prompt.
//
// Work is split into small steps so each fits inside an edge-function run:
//   tick() -> discovers leads for one queued job, or researches 1-2 pending leads.
// HQ calls "kick" right after a request, and pg_cron calls /tick every minute
// so the work keeps going even if the browser tab is closed.
import { admin, getSetting, logActivity } from "./db.ts";

const MODEL = "claude-sonnet-5-5";
const API = "https://api.anthropic.com/v1/messages";
const STALE_MINUTES = 6;

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

export async function anthropicKey(): Promise<string | null> {
  return Deno.env.get("ANTHROPIC_API_KEY") || await getSetting("anthropic_api_key");
}

/** Runs work after the response is sent (falls back to awaiting it). */
export function background(p: Promise<unknown>) {
  const safe = p.catch((e) => console.error("lead agent", e));
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(safe);
  return safe;
}

// ---------------------------------------------------------------------------
// TrueLink offer, used to tailor recommendations
// ---------------------------------------------------------------------------
const OFFER = {
  church: {
    plans: "Seed $197/mo (website chat assistant, guest follow-up, prayer request routing, reminders, weekly announcements email). Harvest $497/mo, the most popular (everything in Seed plus weekly sermon-to-content: 2 clips + 3 graphic posts a week, Facebook and Instagram posting, weekly newsletter, sermon notes, YouTube titles/descriptions, a church website built, hosted and maintained, 2 hours of training, quarterly strategy call). Legacy from $997/mo (everything in Harvest plus more content, livestream support, custom AI agents, online giving, full website management, church-branded dashboard, monthly strategy call, priority support). Yearly billing gets 2 months free. No setup fees, month to month.",
    middle: "Harvest",
    middleIncludes: "a modern church website (home, plan a visit, service times and both campus locations if any, sermons, events, ministries, give, contact), a 24/7 website chat assistant, a ministry dashboard (website visitors, weekly content approval, email list, AI helper activity, plan and billing), one week of sermon-to-content social posts with branded graphics (2 sermon clips + 3 graphic posts for Facebook and Instagram), a weekly newsletter, and sermon notes",
  },
  business: {
    plans: "Essentials $297/mo (missed-call text-back, website chat assistant, instant lead follow-up, appointment reminders, Google review requests). Growth $697/mo, the most popular (everything in Essentials plus a 24/7 AI phone receptionist that books appointments, social media: 16 posts a month on 2 platforms, monthly newsletter and follow-up emails, a 5-page website built, hosted and maintained, 2 hours of training, quarterly strategy call). Partner from $1,497/mo (everything in Growth plus 2 to 4 custom AI agents, social on 3 platforms with short video, full website management, branded dashboard, monthly strategy call, priority support). Yearly billing gets 2 months free. No setup fees, month to month.",
    middle: "Growth",
    middleIncludes: "a modern 5-page website (home, services, about, reviews, contact/booking) with a chat assistant and booking built in, a business dashboard (leads, missed calls texted back, booked appointments, website visitors, reviews, plan and billing), an AI phone receptionist call flow, one week of social media posts with branded graphics, a follow-up email sequence for new leads, and a Google review request message",
  },
} as const;

// ---------------------------------------------------------------------------
// Claude API
// ---------------------------------------------------------------------------
type Block = Record<string, unknown> & { type: string };
type Msg = { role: "user" | "assistant"; content: string | Block[] };

export async function callClaude(opts: {
  key: string;
  system: string;
  prompt: string;
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  maxSearches: number;
  maxTokens: number;
}): Promise<{ input: Record<string, unknown>; usage: { input: number; output: number; searches: number } }> {
  const messages: Msg[] = [{ role: "user", content: opts.prompt }];
  const usage = { input: 0, output: 0, searches: 0 };
  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: opts.maxSearches,
      user_location: { type: "approximate", country: "US", region: "Florida", timezone: "America/New_York" } },
    opts.tool,
  ];

  for (let turn = 0; turn < 6; turn++) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "x-api-key": opts.key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: opts.maxTokens, system: opts.system, tools, messages }),
      signal: AbortSignal.timeout(140_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message ?? `Claude API error ${res.status}`;
      throw new Error(res.status === 401 ? "The Anthropic API key was rejected. Update it in HQ → Settings." : msg);
    }
    usage.input += data.usage?.input_tokens ?? 0;
    usage.output += data.usage?.output_tokens ?? 0;
    usage.searches += data.usage?.server_tool_use?.web_search_requests ?? 0;

    const content = (data.content ?? []) as Block[];
    const call = content.find((b) => b.type === "tool_use" && b.name === opts.tool.name);
    if (call) return { input: call.input as Record<string, unknown>, usage };

    const last = messages[messages.length - 1];
    if (last.role === "assistant" && Array.isArray(last.content)) last.content.push(...content);
    else messages.push({ role: "assistant", content });
    if (data.stop_reason === "pause_turn") continue; // long search turn: resend as-is to continue
    if (data.stop_reason === "max_tokens") throw new Error("The research ran too long. Try again.");
    messages.push({ role: "user", content: `Now call the ${opts.tool.name} tool with your findings.` });
  }
  throw new Error("The AI agent didn't finish. Try again.");
}

// ---------------------------------------------------------------------------
// Step 1: discover leads
// ---------------------------------------------------------------------------
const LEADS_TOOL = {
  name: "save_leads",
  description: "Save the leads you found.",
  input_schema: {
    type: "object",
    properties: {
      leads: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Official name of the church or business" },
            category: { type: "string", description: "e.g. Baptist church, HVAC contractor, dental office" },
            city: { type: "string" },
            address: { type: "string" },
            website: { type: "string", description: "Website URL, or empty if none found" },
            phone: { type: "string", description: "Public main phone, or empty" },
            email: { type: "string", description: "Public general email shown on their site or listing, or empty. Never guess." },
            social: { type: "array", items: { type: "string" }, description: "Facebook/Instagram/YouTube URLs found" },
            leader: { type: "string", description: "Owner or senior pastor name if shown publicly, or empty" },
            why_fit: { type: "string", description: "One sentence: why they would benefit" },
            gaps: { type: "array", items: { type: "string" }, description: "Visible gaps, e.g. no website, last Facebook post 2023" },
          },
          required: ["name", "city", "why_fit"],
        },
      },
    },
    required: ["leads"],
  },
};

async function discover(jobId: string, key: string) {
  const { data: job } = await admin.from("lead_jobs").select("*").eq("id", jobId).single();
  if (!job) return;
  const kind = job.audience === "church" ? "churches" : "local small businesses";
  const { data: existing } = await admin.from("contacts").select("business_name,website").not("business_name", "is", null).limit(400);
  const skip = (existing ?? []).map((c) => c.business_name).filter(Boolean).slice(0, 200).join("; ");

  const prompt = [
    `Find ${job.requested} real, currently operating ${kind}${job.niche ? ` (${job.niche})` : ""} in or near ${job.area}.`,
    `TrueLink Solutions wants leads who would clearly benefit from: ${job.needs.join(", ") || "websites, social media management and automation"}.`,
    "Favor organizations with visible gaps: no website or an outdated one, little or inactive social media, no online booking or giving, few or old Google reviews.",
    job.notes ? `Extra instructions from TrueLink: ${job.notes}` : "",
    skip ? `Skip these, they're already in TrueLink's pipeline: ${skip}` : "",
    `Return exactly ${job.requested} leads if you can find that many qualified ones, fewer if not. Then call save_leads.`,
  ].filter(Boolean).join("\n");

  const system = "You are a careful lead researcher for TrueLink Solutions, a small AI automation and digital presence agency in Port Charlotte, Florida that serves churches and small businesses. Use web search to find real organizations. Only record contact details that are published publicly by the organization or its official listings (website, Google Business Profile, Facebook page, denomination directory, chamber of commerce). Never invent or guess emails, phone numbers or names; leave a field empty instead. Do not collect personal home addresses or personal cell numbers.";

  const { input, usage } = await callClaude({
    key, system, prompt, tool: LEADS_TOOL,
    maxSearches: Math.min(15, 4 + job.requested),
    maxTokens: 8000,
  });

  const leads = (Array.isArray(input.leads) ? input.leads : []) as Record<string, unknown>[];
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  let made = 0;
  for (const l of leads.slice(0, job.requested)) {
    const name = str(l.name);
    if (!name) continue;
    const website = str(l.website) || null;
    const email = str(l.email).toLowerCase() || null;
    const q = (v: string) => `"${v.replace(/["\\]/g, "")}"`;
    const { data: dupe } = await admin.from("contacts").select("id")
      .or([`business_name.ilike.${q(name)}`, website ? `website.eq.${q(website)}` : "", email ? `email.eq.${q(email)}` : ""].filter(Boolean).join(","))
      .limit(1);
    if (dupe?.length) continue;
    const { data: c, error } = await admin.from("contacts").insert({
      business_name: name,
      name: str(l.leader) || null,
      email,
      phone: str(l.phone) || null,
      website,
      city: str(l.city) || null,
      audience: job.audience,
      status: "lead",
      source: "ai_agent",
      tags: ["ai-found", job.audience, ...job.needs.map((n: string) => n.toLowerCase())].slice(0, 8),
    }).select("id").single();
    if (error || !c) { console.error("insert lead", error); continue; }
    await admin.from("lead_research").insert({
      job_id: job.id,
      contact_id: c.id,
      report: { discovery: { category: str(l.category), address: str(l.address), social: l.social ?? [], why_fit: str(l.why_fit), gaps: l.gaps ?? [] } },
    });
    await logActivity(c.id, "system", `Found by the AI lead finder: ${str(l.why_fit)}`);
    made++;
  }
  await admin.from("lead_jobs").update({
    status: made ? "researching" : "done",
    found: made,
    error: made ? null : "No new leads matched. Try a different area, niche or fewer requirements.",
    updated_at: new Date().toISOString(),
  }).eq("id", job.id);
  console.log(`job ${job.id}: ${made} leads, ${usage.searches} searches, ${usage.input}/${usage.output} tokens`);
}

// ---------------------------------------------------------------------------
// Step 2: research one lead
// ---------------------------------------------------------------------------
const REPORT_TOOL = {
  name: "save_report",
  description: "Save the finished research report for this lead.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "2 to 3 sentences: who they are and the biggest opportunity" },
      organization: {
        type: "object",
        properties: {
          category: { type: "string" }, address: { type: "string" }, phone: { type: "string" }, email: { type: "string" },
          website: { type: "string" }, hours_or_service_times: { type: "string" }, size: { type: "string", description: "Rough size, e.g. ~150 members, 2 locations, 8 staff" },
          denomination_or_industry: { type: "string" },
        },
      },
      decision_makers: {
        type: "array",
        items: { type: "object", properties: { name: { type: "string" }, role: { type: "string" }, public_contact: { type: "string" }, source: { type: "string", description: "URL where you found this" } }, required: ["name", "role"] },
      },
      online_presence: {
        type: "object",
        properties: {
          website: { type: "string", description: "Rating (none / outdated / basic / good) and why" },
          social: { type: "array", items: { type: "string" }, description: "One line per platform: URL, followers if shown, how recent/active" },
          reviews: { type: "string", description: "Google rating and review count if found" },
          other: { type: "string" },
        },
      },
      gaps: { type: "array", items: { type: "string" }, description: "Specific things they're missing or doing poorly" },
      opportunities: {
        type: "array",
        items: { type: "object", properties: { need: { type: "string" }, how_truelink_helps: { type: "string" } }, required: ["need", "how_truelink_helps"] },
      },
      recommended_plan: {
        type: "object",
        properties: { plan: { type: "string" }, monthly_price: { type: "number" }, why: { type: "string" } },
        required: ["plan", "why"],
      },
      sales_script: {
        type: "object",
        properties: {
          stage_1_lead_to_warm: {
            type: "object", description: "First contact: earn a reply or a short call (lead -> prospect/warm lead)",
            properties: { goal: { type: "string" }, opener: { type: "string" }, value_hook: { type: "string" }, ask: { type: "string" } },
          },
          stage_2_discovery: {
            type: "object", description: "Discovery call / free 15-minute audit",
            properties: { questions: { type: "array", items: { type: "string" } }, listen_for: { type: "array", items: { type: "string" } } },
          },
          stage_3_close: {
            type: "object", description: "Prospect -> customer",
            properties: { demo_talking_points: { type: "array", items: { type: "string" } }, pitch: { type: "string" }, close: { type: "string" } },
          },
          objections: { type: "array", items: { type: "object", properties: { objection: { type: "string" }, response: { type: "string" } }, required: ["objection", "response"] } },
          follow_up_cadence: { type: "array", items: { type: "string" }, description: "e.g. Day 0 email, Day 3 call, Day 7 email" },
        },
      },
      outreach: {
        type: "object",
        properties: {
          email: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" } } },
          sms: { type: "string", description: "Short text for after they've shared a cell number or agreed to texts" },
          call: { type: "object", properties: { opening: { type: "string" }, voicemail: { type: "string" } } },
        },
      },
      brief: { type: "string", description: "Everything this organization could use from TrueLink, in priority order, as a short brief" },
      demo_prompt: { type: "string", description: "A complete prompt to paste into Claude Code to build a branded demo of the middle-tier package for this organization" },
      sources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" } }, required: ["url"] } },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: ["summary", "gaps", "opportunities", "recommended_plan", "sales_script", "outreach", "brief", "demo_prompt"],
  },
};

async function research(rowId: string, key: string) {
  const { data: row } = await admin.from("lead_research").select("*, contact:contacts(*), job:lead_jobs(*)").eq("id", rowId).single();
  if (!row?.contact) return;
  const c = row.contact;
  const audience: "church" | "business" = c.audience ?? row.job?.audience ?? (/church|ministr|chapel|fellowship/i.test(c.business_name ?? "") ? "church" : "business");
  const offer = OFFER[audience];
  const needs: string[] = row.job?.needs ?? [];
  const outreach: string[] = row.job?.outreach?.length ? row.job.outreach : ["email", "call"];
  const known = { name: c.business_name, contact_name: c.name, city: c.city, website: c.website, phone: c.phone, email: c.email, ...(row.report?.discovery ?? {}) };

  const prompt = `Research this ${audience} and prepare everything TrueLink Solutions needs to win them as a customer.

Lead (from our first pass, may be incomplete): ${JSON.stringify(known)}
${needs.length ? `We're especially offering: ${needs.join(", ")}.` : ""}
Outreach channels to prepare: ${outreach.join(", ")}.

TrueLink's plans: ${offer.plans}

Do this:
1. Search their website, Google Business Profile/reviews, Facebook, Instagram, YouTube and any directory listings.
2. Identify the ${audience === "church" ? "senior/lead pastor and other key leaders (executive pastor, church administrator, media/communications lead)" : "owner(s) and the manager who would make this decision"}, with where you found each name.
3. List concrete gaps (no website, outdated site, not mobile friendly, no online giving/booking, inactive or missing social media, few reviews, no livestream, no email list, etc.).
4. Map each gap to how TrueLink helps, and recommend one plan with the reason.
5. Write a 3-stage sales script in a warm, plain-English, local (Port Charlotte, SW Florida) voice from Josh McLaughlin, founder of TrueLink: stage 1 turns the cold lead into a warm prospect (reply or 15-minute call), stage 2 is the discovery call/free audit, stage 3 closes them as a customer. Include objection handling and a follow-up cadence. Mention one or two specific things you found so it's clearly personal. Never pushy.
6. Write outreach drafts only for these channels: ${outreach.join(", ")}. Email: short, personal, one clear ask, signed "Josh McLaughlin, TrueLink Solutions, (941) 840-3649". SMS: under 300 characters, identifies TrueLink, includes "Reply STOP to opt out". Call: an opening line and a 20-second voicemail.
7. Write a brief of everything they could use from TrueLink, in priority order.
8. Write demo_prompt: a complete, self-contained prompt for Claude Code to build a branded demo of TrueLink's ${offer.middle} package for them: ${offer.middleIncludes}. Include their real name, location(s), ${audience === "church" ? "service times, ministries, leaders" : "services, hours, service area, owner"}, the brand colors/logo style and tone you observed (or sensible choices if unknown), the pages and features to build, sample content written in their voice, and that every sample number must be labeled as sample data. Say to make it mobile-first and to show the TrueLink ${offer.middle} plan in the dashboard's Plan & billing page.
Then call save_report.`;

  const system = "You are TrueLink Solutions' sales research agent. Use web search. Only use information that is publicly published by the organization or official listings, and cite sources. Never invent names, emails or phone numbers: write 'Not found' instead. Don't collect personal home addresses or personal social profiles. Be specific and practical.";

  const { input, usage } = await callClaude({ key, system, prompt, tool: REPORT_TOOL, maxSearches: 6, maxTokens: 12000 });
  const report = { ...input, discovery: row.report?.discovery ?? null, model: MODEL, usage, researched_at: new Date().toISOString() };
  await admin.from("lead_research").update({ status: "done", report, error: null, updated_at: new Date().toISOString() }).eq("id", row.id);

  // Fill in blanks on the contact from what the agent found.
  const org = (input.organization ?? {}) as Record<string, string>;
  const dm = (Array.isArray(input.decision_makers) ? input.decision_makers : []) as { name?: string; role?: string }[];
  const clean = (v?: string) => (v && !/not found|unknown|n\/a/i.test(v) ? v.trim() : null);
  const patch: Record<string, unknown> = {};
  if (!c.name && clean(dm[0]?.name)) patch.name = clean(dm[0]?.name);
  if (!c.phone && clean(org.phone)) patch.phone = clean(org.phone);
  if (!c.website && clean(org.website)) patch.website = clean(org.website);
  if (!c.email && clean(org.email) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(org.email)) {
    const e = org.email.trim().toLowerCase();
    const { data: taken } = await admin.from("contacts").select("id").eq("email", e).maybeSingle();
    if (!taken) patch.email = e;
  }
  const plan = (input.recommended_plan ?? {}) as { monthly_price?: number };
  if (!c.estimated_value && plan.monthly_price) patch.estimated_value = plan.monthly_price;
  if (!c.audience) patch.audience = audience;
  if (Object.keys(patch).length) await admin.from("contacts").update(patch).eq("id", c.id);
  await logActivity(c.id, "system", `AI research ready: ${String(input.summary ?? "").slice(0, 280)}`);
  console.log(`research ${row.id}: ${usage.searches} searches, ${usage.input}/${usage.output} tokens`);
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------
async function claimResearch(): Promise<string | null> {
  const stale = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
  const { data: candidates } = await admin.from("lead_research").select("id,status,attempts")
    .or(`status.eq.pending,and(status.eq.researching,started_at.lt.${stale})`)
    .lt("attempts", 3).order("created_at").limit(3);
  for (const cand of candidates ?? []) {
    const { data } = await admin.from("lead_research")
      .update({ status: "researching", started_at: new Date().toISOString(), attempts: cand.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", cand.id).eq("status", cand.status).eq("attempts", cand.attempts).select("id");
    if (data?.length) return cand.id;
  }
  // Give up on rows that failed 3 times
  await admin.from("lead_research").update({ status: "failed", error: "Stopped after 3 tries." })
    .eq("status", "researching").lt("started_at", stale).gte("attempts", 3);
  return null;
}

async function finishJobs() {
  const { data: jobs } = await admin.from("lead_jobs").select("id").eq("status", "researching");
  for (const j of jobs ?? []) {
    const { count } = await admin.from("lead_research").select("id", { count: "exact", head: true })
      .eq("job_id", j.id).in("status", ["pending", "researching"]);
    if (!count) await admin.from("lead_jobs").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", j.id);
  }
}

/** Does the next piece of work: discovery for a queued job, then up to 2 lead reports. */
export async function tick() {
  const key = await anthropicKey();
  if (!key) return { ok: false, reason: "no key" };

  const { data: queued } = await admin.from("lead_jobs").select("id").eq("status", "queued").order("created_at").limit(1);
  if (queued?.length) {
    const { data: claimed } = await admin.from("lead_jobs").update({ status: "finding", updated_at: new Date().toISOString() })
      .eq("id", queued[0].id).eq("status", "queued").select("id");
    if (claimed?.length) {
      try {
        await discover(queued[0].id, key);
      } catch (e) {
        await admin.from("lead_jobs").update({ status: "failed", error: (e as Error).message, updated_at: new Date().toISOString() }).eq("id", queued[0].id);
      }
      return { ok: true, did: "discover" };
    }
  }
  // Retry discovery that got stuck (e.g. the function was stopped)
  const stale = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
  const tooOld = new Date(Date.now() - 30 * 60_000).toISOString();
  await admin.from("lead_jobs").update({ status: "failed", error: "The search kept timing out. Try fewer leads at a time." })
    .eq("status", "finding").lt("created_at", tooOld);
  await admin.from("lead_jobs").update({ status: "queued" }).eq("status", "finding").lt("updated_at", stale);

  const work: Promise<void>[] = [];
  for (let i = 0; i < 2; i++) {
    const id = await claimResearch();
    if (!id) break;
    work.push(research(id, key).catch(async (e) => {
      const { data: r } = await admin.from("lead_research").select("attempts").eq("id", id).single();
      await admin.from("lead_research").update({
        status: (r?.attempts ?? 3) >= 3 ? "failed" : "pending",
        error: (e as Error).message,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
    }));
  }
  await Promise.all(work);
  await finishJobs();
  return { ok: true, did: work.length ? `research x${work.length}` : "nothing" };
}
