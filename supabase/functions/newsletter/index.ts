//   POST /functions/v1/newsletter/poll  hourly (pg_cron, secret header): import new Substack posts + send
//   POST /functions/v1/newsletter       HQ actions (admin login required)
import { handleNewsletter } from "../_shared/h-newsletter.ts";

Deno.serve(handleNewsletter);
