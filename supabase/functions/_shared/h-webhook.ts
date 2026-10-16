// Receives invoice events from Stripe and keeps the invoices table in sync.
import { admin, getSetting } from "./db.ts";
import { Stripe, stripeClient, upsertInvoice } from "./stripe.ts";

const crypto = Stripe.createSubtleCryptoProvider();

export async function handleWebhook(req: Request): Promise<Response> {
  const stripe = await stripeClient();
  const secret = await getSetting("stripe_webhook_secret");
  const sig = req.headers.get("stripe-signature");
  if (!stripe || !secret || !sig) return new Response("not configured", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret, undefined, crypto);
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }

  try {
    if (event.type === "invoice.deleted") {
      const inv = event.data.object as Stripe.Invoice;
      await admin.from("invoices").delete().eq("stripe_invoice_id", inv.id).eq("status", "draft");
    } else if (event.type.startsWith("invoice.")) {
      await upsertInvoice(event.data.object as Stripe.Invoice);
    }
  } catch (e) {
    console.error("webhook handling failed", e);
    return new Response("error", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
}
