import Stripe from "npm:stripe@17.7.0";
import { admin, getSetting, logActivity } from "./db.ts";

export async function stripeKey(): Promise<string | null> {
  return Deno.env.get("STRIPE_SECRET_KEY") || await getSetting("stripe_secret_key");
}

export function makeStripe(key: string): Stripe {
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

export async function stripeClient(): Promise<Stripe | null> {
  const key = await stripeKey();
  return key ? makeStripe(key) : null;
}

export { Stripe };

const STATUS = new Set(["draft", "open", "paid", "void", "uncollectible"]);

/** Copies a Stripe invoice into our invoices table (insert or update). */
export async function upsertInvoice(inv: Stripe.Invoice, fallbackContactId?: string | null) {
  let contactId = fallbackContactId ?? (inv.metadata?.contact_id || null);
  const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;

  if (!contactId && customerId) {
    const { data } = await admin.from("contacts").select("id").eq("stripe_customer_id", customerId).maybeSingle();
    contactId = data?.id ?? null;
  }
  if (!contactId && inv.customer_email) {
    const { data } = await admin.from("contacts").select("id").eq("email", inv.customer_email).maybeSingle();
    contactId = data?.id ?? null;
  }

  const { data: before } = await admin.from("invoices").select("id,status").eq("stripe_invoice_id", inv.id).maybeSingle();

  const row = {
    contact_id: contactId,
    stripe_invoice_id: inv.id,
    number: inv.number,
    status: STATUS.has(inv.status ?? "") ? inv.status : "draft",
    description: inv.description,
    line_items: (inv.lines?.data ?? []).map((l) => ({
      description: l.description,
      quantity: l.quantity,
      amount: l.amount,
    })),
    amount_due: inv.amount_due,
    amount_paid: inv.amount_paid,
    currency: inv.currency,
    due_date: inv.due_date ? new Date(inv.due_date * 1000).toISOString().slice(0, 10) : null,
    hosted_invoice_url: inv.hosted_invoice_url,
    invoice_pdf: inv.invoice_pdf,
    paid_at: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
  };
  const { data, error } = await admin.from("invoices").upsert(row, { onConflict: "stripe_invoice_id" }).select().single();
  if (error) throw error;

  if (contactId && before?.status !== row.status) {
    const amt = `$${(inv.amount_due / 100).toFixed(2)}`;
    const label = inv.number ?? "Invoice";
    const msg: Record<string, string> = {
      open: `${label} for ${amt} sent`,
      paid: `${label} paid (${amt})`,
      void: `${label} voided`,
      uncollectible: `${label} marked uncollectible`,
    };
    if (msg[row.status as string]) await logActivity(contactId, "invoice", msg[row.status as string]);
    if (row.status === "paid") {
      // A paying lead/prospect becomes a customer automatically.
      await admin.from("contacts").update({ status: "customer" }).eq("id", contactId).in("status", ["lead", "prospect"]);
    }
  }
  return data;
}
