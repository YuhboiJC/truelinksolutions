//   POST /functions/v1/stripe          dashboard actions (admin login required)
//   POST /functions/v1/stripe/webhook  Stripe -> invoice sync (signature verified)
import { handleStripe } from "../_shared/h-stripe.ts";
import { handleWebhook } from "../_shared/h-webhook.ts";

Deno.serve((req) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  return path.endsWith("/webhook") ? handleWebhook(req) : handleStripe(req);
});
