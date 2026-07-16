<?php

function tl_config(): array
{
    static $config = null;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (!file_exists($path)) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['ok' => false, 'error' => 'Server misconfigured (missing config.php)']);
            exit;
        }
        $config = require $path;
    }
    return $config;
}

function tl_db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $db = tl_config()['db'];

    // Local dev/testing supports a raw PDO DSN (e.g. sqlite:...); production
    // uses Hostinger's MySQL host/name/user/pass from config.example.php.
    $dsn = $db['dsn'] ?? sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $db['host'], $db['name']);

    $pdo = new PDO($dsn, $db['user'] ?? null, $db['pass'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    if (str_starts_with($dsn, 'sqlite:')) {
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT NOT NULL UNIQUE,
            sequence_step INTEGER NOT NULL DEFAULT 0,
            last_sequence_sent_at TEXT,
            unsubscribed INTEGER NOT NULL DEFAULT 0,
            unsubscribe_token TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime(\'now\'))
        )');
    }

    return $pdo;
}

// Formats a DateTime the same way both MySQL DATETIME columns and the local
// sqlite test schema store/compare values, so filters work identically.
function tl_datetime(DateTime $date): string
{
    return $date->format('Y-m-d H:i:s');
}
