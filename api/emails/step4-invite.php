<?php

function tl_build_step4_invite(array $subscriber): array
{
    $first = tl_greeting_name($subscriber['name']);
    $greeting = $first !== '' ? "Hey {$first}," : 'Hey there,';
    $calendly = TL_BRAND['calendly_url'];

    $body = <<<HTML
    <p style="margin:0 0 16px 0;">{$greeting}</p>
    <p style="margin:0 0 16px 0;">This is the last email in this little series &mdash; and it's the simplest one.</p>
    <p style="margin:0 0 16px 0;">Over the last couple weeks I've shared a quick win, a few common time-sinks, and a real story from a local business. If any of it sparked an idea (or even a &ldquo;huh, I wonder if that applies to us&rdquo;), I'd genuinely love to hear about it.</p>
    <p style="margin:0 0 16px 0;">So here's an open invite: <strong>book a free 15-minute automation audit</strong> &mdash; no cost, no obligation, no script. We'll look at what's eating your time and I'll hand you at least one idea you can use, whether or not we ever work together.</p>
    <p style="margin:0 0 24px 0;text-align:center;">
      <a href="{$calendly}" style="display:inline-block;background-color:#f0821f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:9999px;">Book Your Free Audit</a>
    </p>
    <p style="margin:0 0 16px 0;">Prefer email? Just reply with a good time (or even just &ldquo;let's talk&rdquo;) and I'll find a slot that works. Either way, you won't get a hard sell from me &mdash; that's just not how I want to run this.</p>
    <p style="margin:0 0 16px 0;">And if now isn't the right time &mdash; totally fine. I'll still pop into your inbox every so often with something useful, never more than that.</p>
    <p style="margin:0 0 4px 0;">Thanks for being here,</p>
    <p style="margin:0;font-weight:600;">Josh McLaughlin</p>
    <p style="margin:0;color:#64748b;">Founder, Truelink Solutions</p>
    HTML;

    return [
        'subject' => 'Want a free automation audit? (No pitch, promise)',
        'preheader' => 'An open, no-obligation invite to a free 15-minute call',
        'body' => $body,
    ];
}
