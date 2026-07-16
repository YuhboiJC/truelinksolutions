<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sequence.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

$email = trim((string) ($input['email'] ?? ''));
$name = trim((string) ($input['name'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address']);
    exit;
}

if (mb_strlen($name) > 80) {
    $name = mb_substr($name, 0, 80);
}

$pdo = tl_db();

try {
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare(
        'INSERT INTO subscribers (name, email, unsubscribe_token, created_at) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$name ?: null, $email, $token, tl_datetime(new DateTime())]);
    $subscriberId = (int) $pdo->lastInsertId();
} catch (PDOException $e) {
    // Unique constraint violation -> already signed up, not a real error.
    if ($e->getCode() === '23000') {
        http_response_code(200);
        echo json_encode([
            'ok' => true,
            'alreadySubscribed' => true,
            'message' => "Looks like you're already signed up — check your inbox for our last email!",
        ]);
        exit;
    }

    error_log('Signup insert failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Something went wrong. Please try again.']);
    exit;
}

$subscriber = [
    'id' => $subscriberId,
    'name' => $name,
    'email' => $email,
    'unsubscribe_token' => $token,
];

try {
    tl_send_step_email($pdo, $subscriber, 1);
} catch (Throwable $e) {
    // The signup itself succeeded even if the welcome email failed to send —
    // don't fail the request, but log it so it can be investigated/resent.
    error_log('Welcome email send failed for subscriber ' . $subscriberId . ': ' . $e->getMessage());
}

echo json_encode([
    'ok' => true,
    'message' => "You're in! Check your inbox — your welcome email is on its way.",
]);
