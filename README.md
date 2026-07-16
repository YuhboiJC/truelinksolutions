# Truelink Solutions — truelinksolutions.com

Marketing site + working signup/email flow for Truelink Solutions, replacing
the previous Hostinger Horizons build. Static frontend, PHP + MySQL backend —
built to run entirely on Hostinger's standard shared web hosting.

## Structure

- `web/` — React + Vite + Tailwind frontend. `npm run build` produces static
  files in `web/dist/`.
- `api/` — PHP backend: signup form handler, welcome/nurture email sequence,
  unsubscribe endpoint, and the daily cron job that advances the sequence.
- `schema.sql` — MySQL schema for the `subscribers` table.
- `composer.json` / `vendor/` — PHPMailer, used to send SMTP email.
- `DEPLOY.md` — step-by-step checklist to go live on Hostinger.

## Local development

```
cd web
npm install
npm run dev
```

The signup form posts to `/api/signup.php`. To test it locally, run the PHP
backend alongside the frontend:

```
php -S localhost:8000 -t api
```

`api/config.php` (gitignored) holds real credentials in production; for
local testing it's fine to point `db.dsn` at a local SQLite file and set
`mail.dry_run` to `true` so emails are logged instead of actually sent — see
`api/config.example.php` for the production template.

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for the full Hostinger go-live checklist.
