<?php

require_once __DIR__ . '/db.php';

$token = trim((string) ($_GET['token'] ?? ''));

if ($token !== '') {
    $pdo = tl_db();
    $stmt = $pdo->prepare('UPDATE subscribers SET unsubscribed = 1 WHERE unsubscribe_token = ?');
    $stmt->execute([$token]);
}

// Show the same confirmation whether or not the token matched a real
// subscriber — there's nothing actionable for the visitor either way, and it
// avoids leaking whether a given token/email is valid.
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unsubscribed — Truelink Solutions</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#081b30;display:flex;align-items:center;justify-content:center;min-height:100vh;">
    <div style="max-width:420px;text-align:center;padding:40px 32px;background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
      <img src="/logo.png" alt="Truelink Solutions" style="height:36px;width:auto;margin-bottom:20px;" />
      <h1 style="font-size:20px;margin:0 0 12px 0;">You're unsubscribed</h1>
      <p style="margin:0;color:#64748b;line-height:1.6;">You won't receive any more emails from Truelink Solutions. If that was a mistake, just reply to any previous email and let us know.</p>
    </div>
  </body>
</html>
