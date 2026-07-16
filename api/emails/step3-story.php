<?php

function tl_build_step3_story(array $subscriber): array
{
    $first = tl_greeting_name($subscriber['name']);
    $greeting = $first !== '' ? "Hey {$first}," : 'Hey there,';

    $body = <<<HTML
    <p style="margin:0 0 16px 0;">{$greeting}</p>
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
    <p style="margin:0;font-weight:600;">Josh</p>
    HTML;

    return [
        'subject' => 'From "missed it again" to handled automatically',
        'preheader' => 'How one local property management company stopped losing after-hours calls',
        'body' => $body,
    ];
}
