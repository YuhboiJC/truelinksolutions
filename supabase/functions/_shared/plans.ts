// TrueLink subscription plans in Stripe: products, prices, Founders coupons,
// Payment Links and the Customer Portal. Everything here is safe to run more
// than once: existing objects are found by lookup key / ID and reused.
import { admin, getSetting, setSetting } from "./db.ts";
import type { Stripe } from "./stripe.ts";

const SITE = "https://truelinksolutions.com";
const ANNUAL_MONTHS = 10; // annual = 10 x monthly ("two months free")

export const PLANS = [
  { id: "seed", name: "Seed (Church)", audience: "church", monthly: 197,
    description: "Website chat assistant, first-time guest follow-up, prayer request routing, event and volunteer reminders, weekly announcements email and TrueLink dashboard." },
  { id: "harvest", name: "Harvest (Church)", audience: "church", monthly: 497,
    description: "Everything in Seed, plus weekly sermon-to-content, Facebook and Instagram posting, weekly newsletter, YouTube details, a hosted church website, 2 hours of training and quarterly strategy calls." },
  { id: "legacy", name: "Legacy (Church)", audience: "church", monthly: 997,
    description: "Everything in Harvest, plus more content, livestream support, custom AI agents, online giving, full website management, a church-branded dashboard, monthly strategy calls and priority support." },
  { id: "essentials", name: "Essentials (Business)", audience: "business", monthly: 297,
    description: "Missed-call text-back, website chat assistant, instant lead follow-up, appointment reminders, Google review requests and TrueLink dashboard." },
  { id: "growth", name: "Growth (Business)", audience: "business", monthly: 697,
    description: "Everything in Essentials, plus an AI phone receptionist, social media management, newsletter, a hosted 5-page website, 2 hours of training and quarterly strategy calls." },
  { id: "partner", name: "Partner (Business)", audience: "business", monthly: 1497,
    description: "Everything in Growth, plus 2 to 4 custom AI agents, social media on 3 platforms, full website management, a branded dashboard, monthly strategy calls and priority support." },
] as const;

// Founders pricing: 20% off Legacy, forever. Invoices show the coupon name
// ("Founders discount (20% off)") with the dollar amount on the line below it.
// Fixed amounts so the totals land exactly on $797/month and $7,970/year
// (a true 20% of $997 is $199.40, which would make it $797.60).
export const FOUNDERS = {
  monthly: { coupon: "FOUNDERS_MONTHLY", name: "Founders discount (20% off)", amount_off: 200_00, lookup: "legacy_monthly" },
  annual: { coupon: "FOUNDERS_ANNUAL", name: "Founders discount (20% off, yearly)", amount_off: 2_000_00, lookup: "legacy_annual" },
} as const;

type Period = "monthly" | "annual";
const lookupKey = (plan: string, p: Period) => `${plan}_${p}`;

/** Finds the price for a lookup key (e.g. "harvest_annual"). */
export async function priceFor(stripe: Stripe, key: string) {
  const { data } = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  return data[0] ?? null;
}

async function ensurePlan(stripe: Stripe, plan: (typeof PLANS)[number]) {
  const { data: existing } = await stripe.prices.list({
    lookup_keys: [lookupKey(plan.id, "monthly"), lookupKey(plan.id, "annual")],
    active: true,
    limit: 2,
  });
  let productId = existing[0] ? String(existing[0].product) : null;
  if (!productId) {
    const found = await stripe.products.search({ query: `metadata['plan']:'${plan.id}' AND active:'true'` }).catch(() => null);
    productId = found?.data[0]?.id ?? null;
  }
  if (!productId) {
    const prod = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { plan: plan.id, audience: plan.audience },
    });
    productId = prod.id;
  }

  const prices: Record<Period, string> = { monthly: "", annual: "" };
  for (const period of ["monthly", "annual"] as Period[]) {
    const key = lookupKey(plan.id, period);
    let price = existing.find((p) => p.lookup_key === key);
    if (!price) {
      price = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: (period === "monthly" ? plan.monthly : plan.monthly * ANNUAL_MONTHS) * 100,
        recurring: { interval: period === "monthly" ? "month" : "year" },
        lookup_key: key,
        transfer_lookup_key: true,
        nickname: `${plan.name.split(" (")[0]} ${period === "monthly" ? "monthly" : "yearly (2 months free)"}`,
        metadata: { plan: plan.id, period },
      });
    }
    prices[period] = price.id;
  }
  if (!existing.length) {
    await stripe.products.update(productId, { default_price: prices.monthly }).catch(() => {});
  }
  return { productId, prices };
}

async function ensureCoupons(stripe: Stripe, legacyProduct: string) {
  const out: Record<string, string> = {};
  for (const f of Object.values(FOUNDERS)) {
    const c = await stripe.coupons.retrieve(f.coupon).catch(() => null);
    if (c && c.valid) {
      if (c.name !== f.name) await stripe.coupons.update(c.id, { name: f.name }).catch(() => {});
      out[f.coupon] = c.id;
      continue;
    }
    const made = await stripe.coupons.create({
      id: f.coupon,
      name: f.name,
      amount_off: f.amount_off,
      currency: "usd",
      duration: "forever",
      applies_to: { products: [legacyProduct] },
      metadata: { founders: "true" },
    });
    out[f.coupon] = made.id;
  }
  return out;
}

async function ensureLinks(stripe: Stripe, catalog: Record<string, { prices: Record<Period, string> }>) {
  const saved: Record<string, Record<Period, { id: string; url: string }>> =
    JSON.parse((await getSetting("stripe_plan_links")) || "{}");
  for (const plan of PLANS) {
    saved[plan.id] ??= {} as Record<Period, { id: string; url: string }>;
    for (const period of ["monthly", "annual"] as Period[]) {
      const price = catalog[plan.id].prices[period];
      const have = saved[plan.id][period];
      if (have?.id) {
        const pl = await stripe.paymentLinks.retrieve(have.id).catch(() => null);
        if (pl?.active) continue;
      }
      const label = plan.name.split(" (")[0];
      const pl = await stripe.paymentLinks.create({
        line_items: [{ price, quantity: 1 }],
        after_completion: { type: "redirect", redirect: { url: `${SITE}/?welcome=${plan.id}#book-call` } },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        phone_number_collection: { enabled: true },
        custom_fields: [{
          key: "org",
          label: { type: "custom", custom: plan.audience === "church" ? "Church name" : "Business name" },
          type: "text",
        }],
        custom_text: {
          submit: { message: `TrueLink ${label}: month to month, no setup fees, cancel any time.` },
        },
        subscription_data: { metadata: { plan: plan.id, period } },
        metadata: { plan: plan.id, period },
      });
      saved[plan.id][period] = { id: pl.id, url: pl.url };
    }
  }
  await setSetting("stripe_plan_links", JSON.stringify(saved));
  return saved;
}

async function ensurePortal(stripe: Stripe, catalog: Record<string, { productId: string; prices: Record<Period, string> }>) {
  const existingId = await getSetting("stripe_portal_config");
  const products = Object.values(catalog).map((c) => ({ product: c.productId, prices: [c.prices.monthly, c.prices.annual] }));
  const features = {
    customer_update: { enabled: true, allowed_updates: ["email", "address", "phone", "name", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      cancellation_reason: { enabled: true, options: ["too_expensive", "missing_features", "switched_service", "unused", "other"] },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "create_prorations",
      products,
    },
  } as Stripe.BillingPortal.ConfigurationCreateParams.Features;
  const business_profile = {
    headline: "TrueLink Solutions: manage your plan and billing",
    privacy_policy_url: SITE,
    terms_of_service_url: SITE,
  };
  const cfg = existingId
    ? await stripe.billingPortal.configurations.update(existingId, { features, business_profile, login_page: { enabled: true } })
    : await stripe.billingPortal.configurations.create({ features, business_profile, login_page: { enabled: true }, default_return_url: SITE });
  await setSetting("stripe_portal_config", cfg.id);
  if (cfg.login_page?.url) await setSetting("stripe_portal_login_url", cfg.login_page.url);
  return cfg.login_page?.url ?? null;
}

/** Creates (or finds) all plans, Founders coupons, Payment Links and the Customer Portal. */
export async function setupPlans(stripe: Stripe) {
  const catalog: Record<string, { productId: string; prices: Record<Period, string> }> = {};
  for (const plan of PLANS) catalog[plan.id] = await ensurePlan(stripe, plan);
  const coupons = await ensureCoupons(stripe, catalog.legacy.productId);
  const links = await ensureLinks(stripe, catalog);
  let portal: string | null = null;
  let portalError: string | null = null;
  try {
    portal = await ensurePortal(stripe, catalog);
  } catch (e) {
    portalError = (e as Error).message;
  }
  return { catalog, coupons, links, portal, portalError };
}

/** Public: the Payment Link URLs for the website's "Get started" buttons. */
export async function publicPlanLinks() {
  const saved = JSON.parse((await getSetting("stripe_plan_links")) || "{}");
  const links: Record<string, Record<string, string>> = {};
  for (const [plan, periods] of Object.entries(saved as Record<string, Record<string, { url: string }>>)) {
    links[plan] = {};
    for (const [period, v] of Object.entries(periods)) if (v?.url) links[plan][period] = v.url;
  }
  return { links, portal: (await getSetting("stripe_portal_login_url")) || null };
}

/**
 * Starts the Legacy plan at Founders pricing for a contact.
 *   method "invoice":  creates the subscription now; Stripe emails each invoice (pay by card or bank).
 *   method "checkout": returns a secure Stripe checkout link (valid 24 hours) with the
 *                      discount already applied; the subscription starts when they pay.
 */
export async function startFounders(
  stripe: Stripe,
  contactId: string,
  period: Period,
  method: "invoice" | "checkout",
) {
  const f = FOUNDERS[period];
  const price = await priceFor(stripe, f.lookup);
  if (!price) throw new Error("The Legacy plan isn't in Stripe yet. Click \"Set up plans in Stripe\" first.");
  const coupon = await stripe.coupons.retrieve(f.coupon).catch(() => null);
  if (!coupon?.valid) throw new Error("The Founders coupon is missing. Click \"Set up plans in Stripe\" first.");

  const { data: c } = await admin.from("contacts").select("*").eq("id", contactId).single();
  if (!c) throw new Error("Contact not found");
  if (!c.email) throw new Error("This contact needs an email address first.");

  let customerId = c.stripe_customer_id as string | null;
  if (!customerId) {
    const cust = await stripe.customers.create({
      email: c.email,
      name: c.business_name || c.name || undefined,
      phone: c.phone || undefined,
      metadata: { contact_id: c.id },
    });
    customerId = cust.id;
    await admin.from("contacts").update({ stripe_customer_id: customerId }).eq("id", c.id);
  }

  // Don't create a second Legacy subscription by accident.
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  const live = subs.data.find((s) => ["active", "trialing", "past_due", "incomplete"].includes(s.status));
  if (live) throw new Error(`This customer already has a ${live.status} subscription (${live.id}). Change it in Stripe instead.`);

  const metadata = { contact_id: c.id, plan: "legacy", period, founders: "true" };

  if (method === "checkout") {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      discounts: [{ coupon: f.coupon }],
      subscription_data: { metadata, description: "TrueLink Legacy plan, Founders pricing (locked in)" },
      success_url: `${SITE}/?welcome=legacy#book-call`,
      cancel_url: `${SITE}/#packages`,
      metadata,
    });
    return { url: session.url, expires_at: session.expires_at };
  }

  const sub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    discounts: [{ coupon: f.coupon }],
    collection_method: "send_invoice",
    days_until_due: 14,
    description: "TrueLink Legacy plan, Founders pricing (locked in)",
    metadata,
  });
  return { subscription: sub.id, status: sub.status };
}
