//   POST /functions/v1/newsletter/poll            every 10 min (pg_cron, secret header): import new Substack posts + send
//   POST /functions/v1/newsletter/resend-webhook  Resend delivery/open/click events (Svix signature verified)
//   POST /functions/v1/newsletter                 HQ actions (admin login required)
import { handleNewsletter } from "../_shared/h-newsletter.ts";

Deno.serve(handleNewsletter);
