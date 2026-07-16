<?php
// Copy this file to config.php (same folder) and fill in real values.
// config.php is gitignored — never commit real credentials.

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'u123456789_truelink',   // hPanel > Databases > MySQL Databases
        'user' => 'u123456789_admin',
        'pass' => 'REPLACE_ME',
    ],

    'mail' => [
        // Hostinger email hosting SMTP — hPanel > Emails > your mailbox > Connect
        // Devices/SMTP settings. Using an app-specific/mailbox password, not your
        // hPanel account password.
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'encryption' => 'ssl', // 'ssl' for port 465, 'tls' for port 587
        'username' => 'info@truelinksolutions.com',
        'password' => 'REPLACE_ME',
        'from_email' => 'info@truelinksolutions.com',
        'from_name' => 'Josh from Truelink Solutions',
    ],

    // Public site URL — used to build unsubscribe links in emails.
    'app_url' => 'https://truelinksolutions.com',

    // Shared secret to protect the cron endpoint from being triggered by
    // anyone who finds the URL. Generate your own random string, e.g.:
    //   php -r "echo bin2hex(random_bytes(24));"
    'cron_key' => 'REPLACE_ME',
];
