<?php
// Run once daily to advance every subscriber through the rest of the
// nurture sequence. See DEPLOY.md for how to schedule this on Hostinger
// (hPanel Cron Jobs, or an external pinger like cron-job.org as a fallback).
//
// Two ways to trigger it safely:
//   1. CLI (preferred, via Hostinger's own Cron Jobs):
//        php /home/USER/public_html/api/cron-nurture.php
//   2. HTTP, if your cron mechanism can only hit a URL:
//        https://truelinksolutions.com/api/cron-nurture.php?key=YOUR_CRON_KEY

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sequence.php';

$isCli = PHP_SAPI === 'cli';

if (!$isCli) {
    $key = $_GET['key'] ?? '';
    if (!hash_equals(tl_config()['cron_key'], (string) $key)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['ok' => false, 'error' => 'Forbidden']);
        exit;
    }
}

$pdo = tl_db();
$sentCount = 0;

for ($step = 1; $step < TL_SEQUENCE_TOTAL_STEPS; $step++) {
    $waitDays = TL_SEQUENCE_WAIT_DAYS[$step + 1];
    $cutoff = new DateTime("-{$waitDays} days");

    $stmt = $pdo->prepare(
        'SELECT * FROM subscribers
         WHERE unsubscribed = 0 AND sequence_step = ? AND last_sequence_sent_at <= ?
         ORDER BY created_at ASC
         LIMIT 200'
    );
    $stmt->execute([$step, tl_datetime($cutoff)]);
    $due = $stmt->fetchAll();

    foreach ($due as $subscriber) {
        try {
            if (tl_send_step_email($pdo, $subscriber, $step + 1)) {
                $sentCount++;
            }
        } catch (Throwable $e) {
            error_log("Nurture email failed for subscriber {$subscriber['id']} (step " . ($step + 1) . '): ' . $e->getMessage());
        }
    }
}

$message = "Nurture cron complete — sent {$sentCount} email(s).";
error_log($message);

if ($isCli) {
    echo $message . PHP_EOL;
} else {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true, 'sent' => $sentCount]);
}
