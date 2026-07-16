<?php

require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/emails/step1-welcome.php';
require_once __DIR__ . '/emails/step2-education.php';
require_once __DIR__ . '/emails/step3-story.php';
require_once __DIR__ . '/emails/step4-invite.php';

const TL_SEQUENCE_TOTAL_STEPS = 4;

// Step => days after the PREVIOUS step before this one is due.
const TL_SEQUENCE_WAIT_DAYS = [
    1 => 0, // sent immediately on signup
    2 => 2,
    3 => 3,
    4 => 4,
];

function tl_build_email_for_step(int $step, array $subscriber): ?array
{
    return match ($step) {
        1 => tl_build_step1_welcome($subscriber),
        2 => tl_build_step2_education($subscriber),
        3 => tl_build_step3_story($subscriber),
        4 => tl_build_step4_invite($subscriber),
        default => null,
    };
}

/**
 * Sends the email for $step to $subscriber and advances its sequence
 * bookkeeping. Returns true if an email was sent.
 */
function tl_send_step_email(PDO $pdo, array $subscriber, int $step): bool
{
    $email = tl_build_email_for_step($step, $subscriber);
    if ($email === null) {
        return false;
    }

    $html = tl_email_layout($email['preheader'], $email['body'], $subscriber['unsubscribe_token']);
    tl_send_mail($subscriber['email'], $email['subject'], $html);

    $stmt = $pdo->prepare(
        'UPDATE subscribers SET sequence_step = ?, last_sequence_sent_at = ? WHERE id = ?'
    );
    $stmt->execute([$step, tl_datetime(new DateTime()), $subscriber['id']]);

    return true;
}
