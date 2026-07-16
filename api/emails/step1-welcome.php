<?php

function tl_build_step1_welcome(array $subscriber): array
{
    $first = tl_greeting_name($subscriber['name']);
    $greeting = $first !== '' ? "Hey {$first}," : 'Hey there,';
    $calendly = TL_BRAND['calendly_url'];

    $body = <<<HTML
    <p style="margin:0 0 16px 0;">{$greeting}</p>
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
      <a href="{$calendly}" style="display:inline-block;background-color:#f0821f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:9999px;">Book Your Free Audit</a>
    </p>
    <p style="margin:0 0 16px 0;">Or just reply to this email any time &mdash; I read and respond to every one personally.</p>
    <p style="margin:0 0 4px 0;">Talk soon,</p>
    <p style="margin:0;font-weight:600;">Josh McLaughlin</p>
    <p style="margin:0;color:#64748b;">Founder, Truelink Solutions</p>
    HTML;

    return [
        'subject' => "Welcome — here's a quick win for your business",
        'preheader' => 'Plus: a free 15-minute automation audit, whenever you\'re ready',
        'body' => $body,
    ];
}
