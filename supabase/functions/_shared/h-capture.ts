// Public endpoint for the website forms (newsletter signup + free audit request).
import { admin, getProfile, logActivity } from "./db.ts";
import { esc, firstName, layout, sendEmail } from "./email.ts";
import { json, preflight } from "./http.ts";
import { sendNurtureStep } from "./send-step.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v: unknown, n: number) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, n) : null;
};

export async function handleCapture(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(req, { ok: false, error: "Method not allowed" }, 405);

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return json(req, { ok: false, error: "Invalid request" }, 400);
  }

  // Honeypot: real people never fill this hidden field.
  if (clip(input.company_website, 200)) return json(req, { ok: true });

  const type = input.type === "audit" ? "audit" : "newsletter";
  const email = clip(input.email, 190)?.toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) return json(req, { ok: false, error: "Please enter a valid email address" }, 422);

  const name = clip(input.name, 80);
  const phone = clip(input.phone, 40);
  const business = clip(input.business_name, 120);
  const message = clip(input.message, 2000);

  const { data: existing } = await admin.from("contacts").select("*").eq("email", email).maybeSingle();

  let contact = existing;
  let newlySubscribed = false;

  if (!existing) {
    const { data, error } = await admin.from("contacts").insert({
      email,
      name,
      phone,
      business_name: business,
      source: type,
      status: "lead",
      subscribed: type === "newsletter",
    }).select().single();
    if (error) {
      console.error("insert failed", error);
      return json(req, { ok: false, error: "Something went wrong. Please try again." }, 500);
    }
    contact = data;
    newlySubscribed = type === "newsletter";
  } else {
    const patch: Record<string, unknown> = {};
    if (!existing.name && name) patch.name = name;
    if (!existing.phone && phone) patch.phone = phone;
    if (!existing.business_name && business) patch.business_name = business;
    if (type === "newsletter" && !existing.subscribed) {
      patch.subscribed = true;
      patch.unsubscribed_at = null;
      newlySubscribed = existing.nurture_step === 0;
    }
    if (Object.keys(patch).length) {
      const { data } = await admin.from("contacts").update(patch).eq("id", existing.id).select().single();
      contact = data ?? existing;
    }
  }

  const profile = await getProfile();

  if (type === "newsletter") {
    await logActivity(contact.id, "form", "Signed up for email tips on the website");
    if (newlySubscribed) {
      try {
        await sendNurtureStep(contact, 1, profile);
      } catch (e) {
        console.error("welcome email failed", e);
      }
    }
    return json(req, {
      ok: true,
      alreadySubscribed: !!existing && !newlySubscribed,
      message: newlySubscribed
        ? "You're in! Check your inbox for your welcome email to TrueLink AI Weekly."
        : "You're already on the list. Watch your inbox on Friday!",
    });
  }

  // Audit request
  const detail = [
    business && `Business: ${business}`,
    phone && `Phone: ${phone}`,
    message && `Notes: ${message}`,
  ].filter(Boolean).join("\n");
  await logActivity(contact.id, "form", `Requested a free 15-minute audit${detail ? "\n" + detail : ""}`);
  await admin.from("contacts").update({ next_follow_up: new Date().toISOString().slice(0, 10) })
    .eq("id", contact.id).is("next_follow_up", null);

  try {
    const greet = firstName(name) ? `Hey ${firstName(name)},` : "Hey there,";
    await sendEmail({
      to: email,
      subject: "Got your audit request — here's how to grab a time",
      html: layout({
        preheader: "Pick a 15-minute slot that works for you",
        profile,
        reason: "You're receiving this because you requested a free audit at truelinksolutions.com.",
        body: `<p style="margin:0 0 16px 0;">${greet}</p>
<p style="margin:0 0 16px 0;">Thanks for requesting a free 15-minute automation audit. If you haven't already picked a time, you can grab one here:</p>
<p style="margin:0 0 24px 0;text-align:center;"><a href="${profile.calendly_url}" style="display:inline-block;background-color:#f0821f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:9999px;">Choose a Time</a></p>
<p style="margin:0 0 16px 0;">Prefer I reach out instead? Just reply to this email with a good time and the best number to call.</p>
<p style="margin:0 0 4px 0;">Talk soon,</p><p style="margin:0;font-weight:600;">Josh McLaughlin</p><p style="margin:0;color:#64748b;">Founder, Truelink Solutions</p>`,
      }),
    });
  } catch (e) {
    console.error("audit confirmation failed", e);
  }

  try {
    await sendEmail({
      to: profile.notify_email,
      replyTo: email,
      subject: `New audit request: ${name ?? email}${business ? ` (${business})` : ""}`,
      html: `<p><strong>New free audit request</strong></p>
<p>Name: ${esc(name) || "—"}<br/>Email: ${esc(email)}<br/>Phone: ${esc(phone) || "—"}<br/>Business: ${esc(business) || "—"}</p>
<p>${esc(message ?? "").replace(/\n/g, "<br/>")}</p>
<p><a href="https://truelinksolutions.com/hq/#/contacts/${contact.id}">Open in TrueLink HQ</a></p>`,
    });
  } catch (e) {
    console.error("owner notification failed", e);
  }

  return json(req, { ok: true, message: "Thanks! Your request is in." });
}
