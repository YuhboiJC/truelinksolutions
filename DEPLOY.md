# Deploying to Hostinger — go-live checklist

Follow these in order. Everything here runs on standard Hostinger shared web
hosting — no VPS, no Node.js hosting, no PocketBase.

## 1. Set your real Calendly link

Free 15-min automation audit needs somewhere to send people. Create a free
[Calendly](https://calendly.com) (or [Cal.com](https://cal.com)) account with
a 15-minute event type, then paste your real scheduling link in **two**
places (they're independent, both need updating):

- `web/src/lib/site.js` → `calendlyUrl`
- `api/mailer.php` → `TL_BRAND['calendly_url']`

## 2. Set your real mailing address

U.S. law (CAN-SPAM) requires a physical mailing address in every commercial
email, and it's good practice on the site footer too. A P.O. box is fine.
Replace the placeholder in:

- `web/src/components/Footer.jsx` → the `[Your Business Mailing Address Here]` text
- `api/mailer.php` → `TL_BRAND['mailing_address']`

## 3. Create the MySQL database

In hPanel → **Databases → MySQL Databases**:
1. Create a new database and database user, note the database name, username,
   and password, and the host (usually `localhost`).
2. Open **phpMyAdmin** for that database, go to the **Import** tab, and
   upload `schema.sql` from this repo (or paste its contents into the SQL
   tab and run it).

## 4. Set up the mailbox + SMTP credentials

In hPanel → **Emails**, confirm the `info@truelinksolutions.com` mailbox
exists (create it if not). Get its SMTP settings under **Connect
Devices/Apps** — you'll need the SMTP host, port, and a mailbox password
(not your main Hostinger account password).

## 5. Configure the backend

On your computer (not committed to git):
```
cp api/config.example.php api/config.php
```
Edit `api/config.php` and fill in:
- `db` — the database host/name/user/pass from step 3
- `mail` — the SMTP host/port/username/password from step 4 (leave
  `dry_run` unset/false — that flag only exists for local testing)
- `app_url` — `https://truelinksolutions.com`
- `cron_key` — generate a random string: `php -r "echo bin2hex(random_bytes(24));"`

## 6. Add SPF/DKIM records (deliverability)

Without these, your automated emails are far more likely to land in spam.
In hPanel → **Emails → Email Deliverability** (or DNS Zone Editor), follow
Hostinger's instructions to add SPF and DKIM records for
`truelinksolutions.com`. This is usually a one-click "Add recommended
records" button.

## 7. Build and upload

```
cd web
npm install
npm run build
```

Upload, via hPanel **File Manager** or FTP, into `public_html/`:
- everything inside `web/dist/` (the built site — `index.html`,
  `assets/`, `logo.png`, `robots.txt`, `sitemap.xml`)
- the `api/` folder (including your real `api/config.php`, not the example)
- the `vendor/` folder (PHPMailer — already committed, no composer needed
  on the server)

End result: `public_html/index.html`, `public_html/api/signup.php`,
`public_html/vendor/...`, etc., all siblings.

## 8. Schedule the daily nurture cron job

In hPanel → **Advanced → Cron Jobs**, add a daily job:
```
php /home/YOUR_USERNAME/public_html/api/cron-nurture.php
```
(Adjust the path to match your actual hosting username — check File Manager
for the exact path.)

If your plan doesn't show Cron Jobs, use a free external pinger like
[cron-job.org](https://cron-job.org) instead, hitting this URL once a day:
```
https://truelinksolutions.com/api/cron-nurture.php?key=YOUR_CRON_KEY
```
(the same `cron_key` you set in `api/config.php`, step 5).

## 9. Test end to end

1. Visit the live site and submit the signup form with your own email.
2. Confirm Email 1 arrives within a minute or two (check spam folder too —
   this is exactly what SPF/DKIM in step 6 helps with).
3. Click the unsubscribe link in that email and confirm it shows the
   confirmation page.
4. Manually run `cron-nurture.php` once (visit the URL from step 8, or run
   it via SSH/cron) to confirm it doesn't error — it won't send anything
   yet since nobody is due for step 2 until 2 days after signup.

## 10. Point the domain here (if not already)

If `truelinksolutions.com` is currently pointed at the old Hostinger
Horizons site, update it in hPanel to serve from this `public_html`
instead (this is usually automatic if you're uploading into the same
hosting account/domain).

---

Once all of the above is done, cancel/downgrade the Hostinger Horizons (AI
site builder) subscription — this project no longer depends on it.
