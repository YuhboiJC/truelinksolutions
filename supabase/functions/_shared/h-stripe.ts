// Dashboard-only Stripe actions. Caller must be a signed-in admin.
import { admin, getSetting, requireAdmin, setSetting } from "./db.ts";
import { json, preflight } from "./http.ts";
import { stripeClient, upsertInvoice } from "./stripe.ts";

const WEBHOOK_EVENTS = [
  "invoice.created", "invoice.finalized", "invoice.sent", "invoice.updated", "invoice.paid",
  "invoice.payment_failed", "invoice.voided", "invoice.marked_uncollectible", "invoice.deleted",
] as const;

export async function handleStripe(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (!(await requireAdmin(req))) return json(req, { ok: false, error: "Not authorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const stripe = stripeClient();

  if (action === "status") {
    const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    return json(req, {
      ok: true,
      connected: !!stripe,
      mode: key.startsWith("sk_live") || key.startsWith("rk_live") ? "live" : key ? "test" : null,
      webhook: !!(await getSetting("stripe_webhook_secret")),
      email: !!Deno.env.get("RESEND_API_KEY"),
    });
  }

  if (!stripe) return json(req, { ok: false, error: "Stripe isn't connected yet. Add STRIPE_SECRET_KEY in Supabase." }, 400);

  try {
    if (action === "setup_webhook") {
      const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe/webhook`;
      const oldId = await getSetting("stripe_webhook_id");
      if (oldId) await stripe.webhookEndpoints.del(oldId).catch(() => {});
      const ep = await stripe.webhookEndpoints.create({
        url,
        enabled_events: [...WEBHOOK_EVENTS],
        description: "TrueLink HQ invoice sync",
      });
      await setSetting("stripe_webhook_id", ep.id);
      await setSetting("stripe_webhook_secret", ep.secret!);
      return json(req, { ok: true });
    }

    if (action === "create_invoice") {
      const { contact_id, items, days_until_due = 14, memo, send = true } = body;
      const lines = (Array.isArray(items) ? items : [])
        .map((i: Record<string, unknown>) => ({
          description: String(i.description ?? "").trim().slice(0, 250),
          quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
          unit_amount: Math.round(Number(i.unit_price) * 100),
        }))
        .filter((l) => l.description && l.unit_amount > 0);
      if (!lines.length) return json(req, { ok: false, error: "Add at least one line item with a price." }, 422);

      const { data: c } = await admin.from("contacts").select("*").eq("id", contact_id).single();
      if (!c) return json(req, { ok: false, error: "Contact not found" }, 404);

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

      const inv = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: Math.max(0, Math.min(90, Number(days_until_due) || 14)),
        description: memo ? String(memo).slice(0, 500) : undefined,
        auto_advance: true,
        pending_invoice_items_behavior: "exclude",
        metadata: { contact_id: c.id },
      });
      for (const l of lines) {
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: inv.id,
          description: l.description,
          quantity: l.quantity,
          unit_amount_decimal: String(l.unit_amount),
          currency: "usd",
        });
      }
      let final = await stripe.invoices.finalizeInvoice(inv.id!);
      if (send) final = await stripe.invoices.sendInvoice(final.id!);
      const row = await upsertInvoice(final, c.id);
      return json(req, { ok: true, invoice: row });
    }

    if (action === "send_invoice" || action === "void_invoice" || action === "sync_invoice" || action === "mark_paid") {
      const { data: row } = await admin.from("invoices").select("stripe_invoice_id,contact_id").eq("id", body.invoice_id).single();
      if (!row?.stripe_invoice_id) return json(req, { ok: false, error: "Invoice not found" }, 404);
      const id = row.stripe_invoice_id;
      const inv =
        action === "send_invoice" ? await stripe.invoices.sendInvoice(id)
        : action === "void_invoice" ? await stripe.invoices.voidInvoice(id)
        : action === "mark_paid" ? await stripe.invoices.pay(id, { paid_out_of_band: true })
        : await stripe.invoices.retrieve(id);
      const saved = await upsertInvoice(inv, row.contact_id);
      return json(req, { ok: true, invoice: saved });
    }

    if (action === "sync_all") {
      let count = 0;
      for await (const inv of stripe.invoices.list({ limit: 100 })) {
        await upsertInvoice(inv);
        if (++count >= 300) break;
      }
      return json(req, { ok: true, count });
    }

    return json(req, { ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { ok: false, error: (e as Error).message }, 500);
  }
}
