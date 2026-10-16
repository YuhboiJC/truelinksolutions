import { firstName } from "./email.ts";

export type Step = { subject: string; preheader: string; body: (name: string | null, calendly: string, archive: string) => string };

export const NURTURE_STEPS: Record<number, Step> = {
  1: {
    subject: "You're in! Welcome to TrueLink AI Weekly",
    preheader: "One practical AI tip in your inbox every Friday",
    body: (name, calendly, archive) => `<p style="margin:0 0 16px 0;">${greet(name)}</p>
<p style="margin:0 0 16px 0;">Thanks for signing up. You're now on the list for <strong>TrueLink AI Weekly</strong>, my free newsletter about using AI in everyday life and in a small business.</p>
<p style="margin:0 0 12px 0;">Here's what to expect. Every Friday you'll get one email with:</p>
<ul style="margin:0 0 16px 0;padding-left:20px;">
<li style="margin-bottom:8px;">The AI news that actually matters this week, in plain English</li>
<li style="margin-bottom:8px;">A heads up on new scams or security issues worth knowing about</li>
<li style="margin-bottom:0;">One practical tip you can try in about ten minutes, plus a deeper look at how it works if you're curious</li>
</ul>
<p style="margin:0 0 16px 0;">No spam and no daily sales pitches. If an issue isn't useful, hit reply and tell me. I read every reply.</p>
<p style="margin:0 0 12px 0;">Want to catch up before Friday? You can read past issues here:</p>
<p style="margin:0 0 24px 0;text-align:center;">
<a href="${archive}" style="display:inline-block;background-color:#f0821f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:9999px;">Read Past Issues</a>
</p>
<p style="margin:0 0 16px 0;">A little about me: I'm Josh, and I run TrueLink Solutions out of Port Charlotte. I help local businesses and churches put AI to work. If you ever want a second pair of eyes on your own business, you can <a href="${calendly}" style="color:#123a66;">book a free 15 minute call</a> anytime.</p>
<p style="margin:0 0 4px 0;">See you Friday,</p>
<p style="margin:0;font-weight:600;">Josh McLaughlin</p>
<p style="margin:0;color:#64748b;">Founder, TrueLink Solutions</p>`,
  },
};

function greet(name: string | null): string {
  const f = firstName(name);
  return f ? `Hey ${f},` : "Hey there,";
}

/** Days to wait after the previous email before sending this step. */
export const WAIT_DAYS: Record<number, number> = { 2: 2, 3: 3, 4: 4 };
// Only the welcome email is sent automatically now. The weekly newsletter
// (sent from the "newsletter" function) replaces the old 4-email drip.
// The old emails 2 to 4 are in git history (commit 9f8231f) if you want them back.
export const TOTAL_STEPS = 1;
