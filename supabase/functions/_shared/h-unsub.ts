import { admin, logActivity } from "./db.ts";
import { json, preflight } from "./http.ts";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function handleUnsubscribe(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  let token = "";
  try {
    token = String((await req.json()).token ?? "");
  } catch { /* ignore */ }
  if (UUID_RE.test(token)) {
    const { data } = await admin.from("contacts")
      .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .eq("subscribed", true)
      .select("id")
      .maybeSingle();
    if (data) await logActivity(data.id, "system", "Unsubscribed from emails");
  }
  // Same answer either way so tokens can't be probed.
  return json(req, { ok: true });
}
