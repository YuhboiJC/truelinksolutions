//   POST /functions/v1/ops               dashboard actions (admin login required)
//   POST /functions/v1/ops/renewals      daily renewal check (pg_cron, secret header)
//   GET  /functions/v1/ops/testimonials  public: published testimonials for the website
import { handleOps } from "../_shared/h-ops.ts";
import { handleRenewals } from "../_shared/h-renewals.ts";
import { handleTestimonials } from "../_shared/h-testimonials.ts";
import { preflight } from "../_shared/http.ts";

Deno.serve((req) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  if (path.endsWith("/testimonials")) return preflight(req) ?? handleTestimonials(req);
  if (path.endsWith("/renewals")) return handleRenewals(req);
  return handleOps(req);
});
