// Dashboard-only actions for Services & Renewals. Caller must be a signed-in admin.
import { admin, requireAdmin, setSetting } from "./db.ts";
import { json, preflight } from "./http.ts";
import { hostingerFetch, hostingerToken, syncHostinger } from "./hostinger.ts";
import { runRenewalCheck } from "./h-renewals.ts";

export async function handleOps(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (!(await requireAdmin(req))) return json(req, { ok: false, error: "Not authorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "status") {
      const { data } = await admin.from("app_settings").select("updated_at").eq("key", "hostinger_last_sync").maybeSingle();
      return json(req, { ok: true, hostinger: !!(await hostingerToken()), last_sync: data?.updated_at ?? null });
    }
    if (action === "save_hostinger_token") {
      const token = String(body.token ?? "").trim();
      if (token.length < 20) return json(req, { ok: false, error: "That doesn't look like a Hostinger API token." }, 422);
      try {
        await hostingerFetch("/api/billing/v1/subscriptions", token);
      } catch (e) {
        return json(req, { ok: false, error: `Hostinger rejected that token: ${(e as Error).message}` }, 422);
      }
      await setSetting("hostinger_api_token", token);
      const counts = await syncHostinger(token);
      await setSetting("hostinger_last_sync", new Date().toISOString());
      return json(req, { ok: true, ...counts });
    }
    if (action === "sync_hostinger") {
      const token = await hostingerToken();
      if (!token) return json(req, { ok: false, error: "Connect Hostinger in Settings first." }, 400);
      const counts = await syncHostinger(token);
      await setSetting("hostinger_last_sync", new Date().toISOString());
      return json(req, { ok: true, ...counts });
    }
    if (action === "send_renewal_digest") {
      const r = await runRenewalCheck({ force: true });
      return json(req, { ok: true, ...r });
    }
  } catch (e) {
    return json(req, { ok: false, error: (e as Error).message }, 500);
  }
  return json(req, { ok: false, error: "Unknown action" }, 400);
}
