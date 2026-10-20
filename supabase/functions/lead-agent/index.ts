//   POST /functions/v1/lead-agent        dashboard actions (admin login required)
//   POST /functions/v1/lead-agent/tick   pg_cron every minute (secret header)
import { handleLeadAgent, handleLeadTick } from "../_shared/h-lead-agent.ts";

Deno.serve((req) => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  return path.endsWith("/tick") ? handleLeadTick(req) : handleLeadAgent(req);
});
