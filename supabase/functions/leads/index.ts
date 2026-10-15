// Public website endpoints:
//   POST /functions/v1/leads/capture      newsletter signup + audit request
//   POST /functions/v1/leads/unsubscribe  one-click unsubscribe
//   POST /functions/v1/leads/nurture      daily nurture run (pg_cron, secret header)
import { handleCapture } from "../_shared/h-capture.ts";
import { handleNurture } from "../_shared/h-nurture.ts";
import { handleUnsubscribe } from "../_shared/h-unsub.ts";
import { json, preflight } from "../_shared/http.ts";

Deno.serve((req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  if (path.endsWith("/capture")) return handleCapture(req);
  if (path.endsWith("/unsubscribe")) return handleUnsubscribe(req);
  if (path.endsWith("/nurture")) return handleNurture(req);
  return json(req, { ok: false, error: "Not found" }, 404);
});
