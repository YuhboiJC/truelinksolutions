// Called once a day by pg_cron. Sends the next nurture email to anyone who is due.
import { admin, getProfile, getSetting } from "./db.ts";
import { TOTAL_STEPS, WAIT_DAYS } from "./nurture.ts";
import { sendNurtureStep } from "./send-step.ts";

export async function handleNurture(req: Request): Promise<Response> {
  const secret = await getSetting("cron_secret");
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false }), { status: 403 });
  }
  const profile = await getProfile();
  let sent = 0;
  const errors: string[] = [];

  // Retry welcome emails that failed at signup (e.g. email provider hiccup).
  const { data: unsent } = await admin.from("contacts")
    .select("id,name,email,unsubscribe_token")
    .eq("subscribed", true)
    .is("unsubscribed_at", null)
    .eq("nurture_step", 0)
    .eq("source", "newsletter")
    .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString())
    .limit(100);
  for (const c of unsent ?? []) {
    try {
      if (await sendNurtureStep(c, 1, profile)) sent++;
    } catch (e) {
      errors.push(`${c.id}: ${(e as Error).message}`);
    }
  }

  for (let step = 1; step < TOTAL_STEPS; step++) {
    const next = step + 1;
    const cutoff = new Date(Date.now() - WAIT_DAYS[next] * 86400_000).toISOString();
    const { data: due } = await admin.from("contacts")
      .select("id,name,email,unsubscribe_token")
      .eq("subscribed", true)
      .is("unsubscribed_at", null)
      .eq("nurture_step", step)
      .lte("nurture_last_sent_at", cutoff)
      .order("created_at")
      .limit(100);
    for (const c of due ?? []) {
      try {
        if (await sendNurtureStep(c, next, profile)) sent++;
      } catch (e) {
        errors.push(`${c.id}: ${(e as Error).message}`);
      }
    }
  }
  if (errors.length) console.error(errors);
  return new Response(JSON.stringify({ ok: true, sent, failed: errors.length }), {
    headers: { "Content-Type": "application/json" },
  });
}
