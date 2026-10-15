import { firstName } from "./email.ts";

export type Step = { subject: string; preheader: string; body: (name: string | null, calendly: string) => string };

export const NURTURE_STEPS: Record<number, Step> = {
  1: {
    subject: "Welcome \u2014 here's a quick win for your business",
    preheader: "Plus: a free 15-minute automation audit, whenever you're ready",
    body: (name, calendly) => `<p style="margin:0 0 16px 0;">${greet(name)}</p>
<p style="margin:0 0 16px 0;">Thanks for stopping by Truelink Solutions &mdash; and for trusting me with your email. I don't take that lightly, so here's my promise: no spam, no daily sales pitches. Just useful stuff, every now and then.</p>
<p style="margin:0 0 16px 0;">I'm Josh. I run Truelink out of Port Charlotte, and I'm a small business owner myself. I started this because I kept watching local businesses &mdash; property managers, clinics, contractors, shops &mdash; lose time and money to things that could quietly run on autopilot.</p>
<p style="margin:0 0 12px 0;">Over the next couple of weeks I'll send a few short emails:</p>
<ul style="margin:0 0 16px 0;padding-left:20px;">
<li style="margin-bottom:8px;">A few quick-win automation ideas for your own business</li>
<li style="margin-bottom:8px;">A real story from a local business that automated its missed calls</li>
<li style="margin-bottom:0;">An open invite for a free 15-minute automation audit, whenever you're ready</li>
</ul>
<p style="margin:0 0 12px 0;">To kick things off, here's a quick win you can think about this week:</p>
<div style="background-color:#fde8d2;border-left:4px solid #f0821f;border-radius:8px;padding:16px 20px;margin:0 0 20px 0;">
<p style="margin:0 0 8px 0;font-weight:600;color:#081b30;">Missed-call text-back</p>
<p style="margin:0;">If your phone rings and you can't pick up, most callers just hang up and try the next business. A simple automation can text them back within seconds &mdash; &ldquo;Hey, sorry we missed you! What can we help with?&rdquo; &mdash; and keep that lead warm. It's a small thing that quietly protects revenue you didn't know you were losing.</p>
</div>
<p style="margin:0 0 20px 0;">If you'd like a second pair of eyes on your business sooner rather than later, I'm offering a <strong>free 15-minute automation audit</strong> &mdash; no cost, no obligation, just a real conversation and at least one idea you can use.</p>
<p style="margin:0 0 24px 0;text-align:center;">
<a href="${calendly}" style="display:inline-block;background-color:#f0821f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:9999px;">Book Your Free Audit</a>
</p>
<p style="margin:0 0 16px 0;">Or just reply to this email any time &mdash; I read and respond to every one personally.</p>
<p style="margin:0 0 4px 0;">Talk soon,</p>
<p style="margin:0;font-weight:600;">Josh McLaughlin</p>
<p style="margin:0;color:#64748b;">Founder, Truelink Solutions</p>`,
  },
  2: {
    subject: "The 'small' tasks quietly costing you the most",
    preheader: "Three places small businesses leak hours (and money) every week",
    body: (name, calendly) => `<p style="margin:0 0 16px 0;">${greet(name)}</p>
<p style="margin:0 0 16px 0;">Quick one today &mdash; no pitch, just something I think about a lot.</p>
<p style="margin:0 0 16px 0;">When I talk with business owners around Port Charlotte, Punta Gorda, Venice, Sarasota, Cape Coral, and Fort Myers, the same three time-sinks come up again and again:</p>
<div style="margin:0 0 14px 0;">
<p style="margin:0 0 4px 0;font-weight:600;color:#081b30;">1. Answering the same questions, over and over</p>
<p style="margin:0;">&ldquo;What are your hours?&rdquo; &ldquo;Do you take X insurance?&rdquo; &ldquo;How much does Y cost?&rdquo; Multiply that by 20 calls or messages a day, and that's hours of your week gone to questions a simple AI chat assistant could answer instantly &mdash; any time, day or night.</p>
</div>
<div style="margin:0 0 14px 0;">
<p style="margin:0 0 4px 0;font-weight:600;color:#081b30;">2. Chasing people for appointments</p>
<p style="margin:0;">No-shows and last-minute cancellations hurt. Automated reminders sent a day before &mdash; and again a couple hours before &mdash; can cut no-shows noticeably, without you lifting a finger.</p>
</div>
<div style="margin:0 0 16px 0;">
<p style="margin:0 0 4px 0;font-weight:600;color:#081b30;">3. Letting leads go cold</p>
<p style="margin:0;">Someone fills out a form or calls after hours, and if nobody follows up within minutes, the odds of them becoming a customer drop fast. Even a simple automated &ldquo;thanks, we got your message &mdash; here's what happens next&rdquo; keeps that door open.</p>
</div>
<p style="margin:0 0 16px 0;">None of this requires becoming a &ldquo;tech company.&rdquo; It just means letting a few small, smart tools handle the repetitive stuff so you can focus on the work only you can do.</p>
<p style="margin:0 0 16px 0;">Next time, I'll share a real example from a local business &mdash; including the actual numbers.</p>
<p style="margin:0 0 16px 0;">If any of the three above sound familiar, just hit reply and tell me which one. I genuinely like hearing what's going on for other SW Florida business owners.</p>
<p style="margin:0 0 4px 0;">Talk soon,</p>
<p style="margin:0;font-weight:600;">Josh</p>`,
  },
  3: {
    subject: "From \"missed it again\" to handled automatically",
    preheader: "How one local property management company stopped losing after-hours calls",
    body: (name, calendly) => `<p style="margin:0 0 16px 0;">${greet(name)}</p>
<p style="margin:0 0 16px 0;">A few days back I mentioned I'd share a real example &mdash; here it is.</p>
<p style="margin:0 0 16px 0;">I worked with a property management company here in SW Florida &mdash; the kind that handles maintenance requests, tenant questions, and showings (sound familiar to anyone?). Before we worked together, their front desk was getting buried: phones ringing during showings, tenants texting about AC issues at 9pm, and a small team trying to keep up with all of it during business hours only.</p>
<p style="margin:0 0 16px 0;">We set up an AI-powered chat and voice assistant that could answer common questions, log maintenance requests, and route anything urgent straight to the right person &mdash; 24/7.</p>
<div style="background-color:#eef4fb;border-left:4px solid #123a66;border-radius:8px;padding:16px 20px;margin:0 0 16px 0;">
<p style="margin:0;">It now handles roughly <strong>87% of incoming questions on its own</strong>, with an average response time of about <strong>3 minutes</strong> &mdash; down from hours. Their team spends its time on the stuff that actually needs a human: tenant relationships, walkthroughs, and problem-solving.</p>
</div>
<p style="margin:0 0 16px 0;">I'm not sharing this to brag &mdash; Truelink Solutions is still small, and I like it that way, because it means you get me, not a call center. I'm sharing it because the underlying idea applies almost anywhere: clinics, contractors, salons, law offices, retail &mdash; anywhere people ask similar questions or try to reach you outside business hours.</p>
<p style="margin:0 0 16px 0;">If you've ever thought &ldquo;I wish someone could just answer that for us when we're slammed,&rdquo; that's usually a sign something like this could help.</p>
<p style="margin:0 0 16px 0;">No pressure at all &mdash; but if you're curious what this might look like for your business, just reply and tell me a bit about it. I'm happy to share thoughts either way, even if it's just a free idea you could try yourself.</p>
<p style="margin:0 0 4px 0;">Talk soon,</p>
<p style="margin:0;font-weight:600;">Josh</p>`,
  },
  4: {
    subject: "Want a free automation audit? (No pitch, promise)",
    preheader: "An open, no-obligation invite to a free 15-minute call",
    body: (name, calendly) => `<p style="margin:0 0 16px 0;">${greet(name)}</p>
<p style="margin:0 0 16px 0;">This is the last email in this little series &mdash; and it's the simplest one.</p>
<p style="margin:0 0 16px 0;">Over the last couple weeks I've shared a quick win, a few common time-sinks, and a real story from a local business. If any of it sparked an idea (or even a &ldquo;huh, I wonder if that applies to us&rdquo;), I'd genuinely love to hear about it.</p>
<p style="margin:0 0 16px 0;">So here's an open invite: <strong>book a free 15-minute automation audit</strong> &mdash; no cost, no obligation, no script. We'll look at what's eating your time and I'll hand you at least one idea you can use, whether or not we ever work together.</p>
<p style="margin:0 0 24px 0;text-align:center;">
<a href="${calendly}" style="display:inline-block;background-color:#f0821f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:9999px;">Book Your Free Audit</a>
</p>
<p style="margin:0 0 16px 0;">Prefer email? Just reply with a good time (or even just &ldquo;let's talk&rdquo;) and I'll find a slot that works. Either way, you won't get a hard sell from me &mdash; that's just not how I want to run this.</p>
<p style="margin:0 0 16px 0;">And if now isn't the right time &mdash; totally fine. I'll still pop into your inbox every so often with something useful, never more than that.</p>
<p style="margin:0 0 4px 0;">Thanks for being here,</p>
<p style="margin:0;font-weight:600;">Josh McLaughlin</p>
<p style="margin:0;color:#64748b;">Founder, Truelink Solutions</p>`,
  },
};

function greet(name: string | null): string {
  const f = firstName(name);
  return f ? `Hey ${f},` : "Hey there,";
}

/** Days to wait after the previous email before sending this step. */
export const WAIT_DAYS: Record<number, number> = { 2: 2, 3: 3, 4: 4 };
export const TOTAL_STEPS = 4;
