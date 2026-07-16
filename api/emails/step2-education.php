<?php

function tl_build_step2_education(array $subscriber): array
{
    $first = tl_greeting_name($subscriber['name']);
    $greeting = $first !== '' ? "Hey {$first}," : 'Hey there,';

    $body = <<<HTML
    <p style="margin:0 0 16px 0;">{$greeting}</p>
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
    <p style="margin:0;font-weight:600;">Josh</p>
    HTML;

    return [
        'subject' => "The 'small' tasks quietly costing you the most",
        'preheader' => 'Three places small businesses leak hours (and money) every week',
        'body' => $body,
    ];
}
