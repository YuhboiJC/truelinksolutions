// Pulls subscriptions + domains from the Hostinger API into the services table.
// Only provider-owned fields (renewal date, cost, auto-renew) are overwritten on
// re-sync; the customer link, client price and notes you set in HQ are kept.
import { admin, getSetting } from "./db.ts";

const API = "https://developers.hostinger.com";

type Sub = {
  id: string; name: string; status: string; billing_period: number; billing_period_unit: string;
  renewal_price: number | null; total_price: number; is_auto_renewed: boolean;
  expires_at: string | null; next_billing_at: string | null;
};
type Domain = { id: number; domain: string | null; type: string; status: string; expires_at: string | null };

export async function hostingerFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Hostinger ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json() as T;
}

export const hostingerToken = () => getSetting("hostinger_api_token");

function category(name: string): string {
  if (/domain/i.test(name)) return "domain";
  if (/email|mail/i.test(name)) return "email";
  if (/hosting|vps|cloud|website/i.test(name)) return "hosting";
  return "other";
}

function cycle(s: Sub): string {
  return s.billing_period_unit?.startsWith("month") && s.billing_period === 1 ? "monthly" : "yearly";
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : null);

async function upsertProvider(externalId: string, fresh: Record<string, unknown>, insertOnly: Record<string, unknown>) {
  const { data: existing } = await admin.from("services").select("id").eq("external_id", externalId).maybeSingle();
  if (existing) {
    await admin.from("services").update(fresh).eq("id", existing.id);
    return "updated";
  }
  await admin.from("services").insert({ external_id: externalId, provider: "Hostinger", account_owner: "truelink", ...insertOnly, ...fresh });
  return "added";
}

export async function syncHostinger(token: string) {
  const [subs, domains] = await Promise.all([
    hostingerFetch<Sub[]>("/api/billing/v1/subscriptions", token),
    hostingerFetch<Domain[]>("/api/domains/v1/portfolio", token),
  ]);
  const counts = { added: 0, updated: 0 };
  const bump = (r: string) => (counts[r as "added" | "updated"]++);

  // Domains come from the portfolio (it has the real domain name); the matching
  // ".COM Domain"-style subscription supplies the renewal price.
  const domainSubs = subs.filter((s) => category(s.name) === "domain");
  for (const d of domains.filter((x) => x.domain && x.type === "domain")) {
    const tld = d.domain!.split(".").pop()!.toLowerCase();
    const sub = domainSubs.find((s) => s.name.toLowerCase().includes(`.${tld}`)) ?? (domainSubs.length === 1 ? domainSubs[0] : undefined);
    bump(await upsertProvider(`hostinger:domain:${d.id}`, {
      renews_on: day(d.expires_at),
      auto_renew: sub?.is_auto_renewed ?? true,
      our_cost: sub ? (sub.renewal_price ?? sub.total_price) / 100 : null,
      status: d.status === "active" ? "active" : d.status === "expired" ? "paused" : "in_progress",
    }, { category: "domain", name: d.domain, url: `https://${d.domain}`, billing_cycle: "yearly" }));
  }

  for (const s of subs.filter((x) => category(x.name) !== "domain")) {
    bump(await upsertProvider(`hostinger:sub:${s.id}`, {
      renews_on: day(s.next_billing_at ?? s.expires_at),
      auto_renew: s.is_auto_renewed,
      our_cost: (s.renewal_price ?? s.total_price) / 100,
      billing_cycle: cycle(s),
      status: ["cancelled", "expired"].includes(s.status) ? "cancelled" : s.status === "paused" ? "paused" : "active",
    }, { category: category(s.name), name: `Hostinger ${s.name}` }));
  }
  return counts;
}
