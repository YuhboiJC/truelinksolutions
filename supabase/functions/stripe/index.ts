//   POST /functions/v1/stripe          dashboard actions (admin login required)
//   POST /functions/v1/stripe/webhook  Stripe -> invoice sync (signature verified)
//   GET  /functions/v1/stripe/plans    public Payment Link URLs for the website
import { handlePlans, handleStripe } from "../_shared/h-stripe.ts";
import { handleWebhook } from "../_shared/h-webhook.ts";

Deno.serve((req) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  if (path.endsWith("/webhook")) return handleWebhook(req);
  if (path.endsWith("/plans")) return handlePlans(req);
  return handleStripe(req);
});
