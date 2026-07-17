<?php

require_once __DIR__ . '/db.php';

const TL_BRAND = [
    'name' => 'Truelink Solutions',
    'phone' => '(941) 840-3649',
    'logo_url' => 'https://truelinksolutions.com/logo.png',
    // TODO: replace with your real Calendly (or Cal.com) link — keep in sync
    // with web/src/lib/site.js so the site and emails point to the same place.
    'calendly_url' => 'https://calendly.com/truelink-solutions/15min',
    // CAN-SPAM requires a physical mailing address in every commercial email.
    'mailing_address' => '[Your Business Mailing Address Here], Southwest Florida',
];

function tl_greeting_name(?string $name): string
{
    $name = trim((string) $name);
    if ($name === '') {
        return '';
    }
    $first = explode(' ', $name)[0];
    return htmlspecialchars($first, ENT_QUOTES, 'UTF-8');
}

function tl_unsubscribe_url(string $token): string
{
    $base = rtrim(tl_config()['app_url'], '/');
    return "{$base}/api/unsubscribe.php?token=" . urlencode($token);
}

// Wraps a block of body HTML in the shared branded email layout.
function tl_email_layout(string $preheader, string $bodyHtml, string $unsubscribeToken): string
{
    $brand = TL_BRAND;
    $preheaderSafe = htmlspecialchars($preheader, ENT_QUOTES, 'UTF-8');
    $unsubscribeUrl = tl_unsubscribe_url($unsubscribeToken);

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{$brand['name']}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#081b30;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{$preheaderSafe}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#123a66,#f0821f);padding:28px 32px;text-align:center;">
                <img src="{$brand['logo_url']}" alt="{$brand['name']}" style="height:42px;width:auto;display:inline-block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px;font-size:16px;line-height:1.65;color:#1f2937;">
                {$bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;font-size:13px;line-height:1.6;color:#64748b;border-top:1px solid #e2e8f0;">
                <p style="margin:16px 0 4px 0;">{$brand['name']} &middot; {$brand['mailing_address']}</p>
                <p style="margin:0 0 4px 0;">
                  <a href="mailto:info@truelinksolutions.com" style="color:#123a66;text-decoration:none;">info@truelinksolutions.com</a>
                  &middot; {$brand['phone']}
                </p>
                <p style="margin:12px 0 0 0;">
                  You're receiving this because you signed up at truelinksolutions.com.
                  <a href="{$unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
HTML;
}

/**
 * Sends one email. In local/dry-run mode this just logs instead of hitting
 * real SMTP (see config.php's mail.dry_run) — set it to false once real
 * SMTP credentials are in config.php on Hostinger.
 */
function tl_send_mail(string $toEmail, string $subject, string $html): void
{
    $mailConfig = tl_config()['mail'];

    if (!empty($mailConfig['dry_run'])) {
        error_log("[DRY RUN] Would send \"{$subject}\" to {$toEmail}");
        return;
    }

    require_once __DIR__ . '/../vendor/autoload.php';

    $mailer = new PHPMailer\PHPMailer\PHPMailer(true);
    $mailer->CharSet = PHPMailer\PHPMailer\PHPMailer::CHARSET_UTF8;
    $mailer->isSMTP();
    $mailer->Host = $mailConfig['host'];
    $mailer->Port = $mailConfig['port'];
    $mailer->SMTPAuth = true;
    $mailer->Username = $mailConfig['username'];
    $mailer->Password = $mailConfig['password'];
    $mailer->SMTPSecure = $mailConfig['encryption'] === 'tls'
        ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS
        : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;

    $mailer->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
    $mailer->addAddress($toEmail);
    $mailer->isHTML(true);
    $mailer->Subject = $subject;
    $mailer->Body = $html;

    $mailer->send();
}
