# Truelink Solutions: website + TrueLink HQ

| Folder | What it is | Where it runs |
|---|---|---|
| `web/` | Marketing site (React + Vite + Tailwind) | Hostinger `public_html/` |
| `hq/` | **TrueLink HQ** dashboard: contacts, pipeline, invoices | Hostinger `public_html/hq/` → truelinksolutions.com/hq |
| `supabase/functions/` | Server code (edge functions) | Supabase project `truelinksolutions` |

Everything is stored in **Supabase** (one database). No PHP or MySQL.

## How the pieces connect

- **Website forms** (newsletter signup + "Book a Free Audit") → `leads/capture` edge function →
  creates/updates a row in `contacts`, logs it in `activities`, sends emails through **Resend**.
- **Welcome series**: 4 emails (day 0, +2, +3, +4). A `pg_cron` job calls `leads/nurture`
  every hour; it sends whatever is due and retries failed welcome emails.
- **Unsubscribe**: `truelinksolutions.com/unsubscribe.html?token=…` → `leads/unsubscribe`.
- **TrueLink HQ** signs in with Supabase Auth. Row Level Security only lets emails in the
  `admins` table see data.
- **Invoices**: HQ → `stripe` edge function creates the Stripe customer + invoice and Stripe
  emails it. Stripe calls `stripe/webhook` when it's paid/voided, and HQ updates automatically
  (a paid lead becomes a customer).

## Secrets (Supabase → Edge Functions → Secrets)

- `RESEND_API_KEY`: optional. Already stored server-only in `app_settings` (send-only key, created Oct 15, 2026)
- `STRIPE_SECRET_KEY`: optional. Easier: paste it in HQ → Settings (stored server-only in `app_settings`)

The Stripe webhook secret is created automatically when you click **Turn on payment sync** in
HQ → Settings.

## Database tables

`contacts`, `activities`, `invoices`, `business_profile` (mailing address, booking link,
alert email: editable in HQ → Settings), `admins` (who can sign in), `app_settings` (server-only).

## Build & deploy

```bash
./build.sh          # → release/truelink-site.zip
```
Upload `truelink-site.zip` to Hostinger `public_html` and extract it (or ask Claude to deploy it).

Edge functions: deploy `supabase/functions/leads` and `supabase/functions/stripe`
(both with JWT verification **off**: they check auth themselves).

## Local development

```bash
cd web && npm install && npm run dev   # site on :5173
cd hq  && npm install && npm run dev   # dashboard on :5174
```
