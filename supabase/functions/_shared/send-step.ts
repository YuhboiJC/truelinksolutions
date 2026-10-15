import { admin, logActivity, type BusinessProfile } from "./db.ts";
import { layout, sendEmail } from "./email.ts";
import { NURTURE_STEPS } from "./nurture.ts";

type NurtureContact = { id: string; name: string | null; email: string; unsubscribe_token: string };

export async function sendNurtureStep(contact: NurtureContact, step: number, profile: BusinessProfile) {
  const tpl = NURTURE_STEPS[step];
  if (!tpl) return false;
  const html = layout({
    preheader: tpl.preheader,
    body: tpl.body(contact.name, profile.calendly_url),
    profile,
    unsubscribeToken: contact.unsubscribe_token,
  });
  await sendEmail({ to: contact.email, subject: tpl.subject, html, unsubscribeToken: contact.unsubscribe_token });
  await admin.from("contacts")
    .update({ nurture_step: step, nurture_last_sent_at: new Date().toISOString() })
    .eq("id", contact.id);
  await logActivity(contact.id, "email", `Nurture email ${step} sent: "${tpl.subject}"`);
  return true;
}
