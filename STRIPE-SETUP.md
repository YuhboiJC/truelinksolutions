# Stripe setup for TrueLink plans

How to take payments for TrueLink's monthly and annual plans, let customers upgrade, downgrade
or cancel on their own, and bill Healer's House at Founders pricing.

**The short version:** Stripe does almost all of the hard parts for you.

| What you need | What does it | You build anything? |
|---|---|---|
| Sign-up and first payment | **Stripe Checkout** (via Payment Links to start) | No |
| Recurring monthly or yearly billing | **Stripe Billing subscriptions** | No |
| Receipts, failed-card retries, reminder emails | Stripe Billing settings | No |
| Change card, see invoices, upgrade, downgrade, cancel | **Stripe Customer Portal** | No |
| Customer's plan showing in their TrueLink dashboard | Stripe webhook → Supabase | Yes (phase 2, Claude builds it) |

---

## Step 1: Finish activating the account (you)

In the Stripe Dashboard, finish the checklist you already started, in this order:

1. **Verify the business** (Settings → Business → Account details). Use Staying Connected LLC,
   your EIN, and the business address. Until this is done, Stripe won't pay out to your bank.
2. **Payment methods** (Settings → Payments → Payment methods): turn on **Cards** and
   **ACH Direct Debit (US bank account)**. ACH costs 0.8% capped at $5, which is a big saving on
   Legacy and Partner plans. Churches often prefer paying by bank.
3. **Tax** (Settings → Tax): add your Florida origin address. Most SaaS and service
   subscriptions sold to Florida customers are not subject to Florida sales tax, but ask your
   accountant to confirm for your mix of services before turning on automatic tax. Treasury is
   optional and not needed for any of this.
4. **Branding** (Settings → Branding): upload the TrueLink logo, set brand color `#123a66` and
   accent `#f0821f`. This brands Checkout, invoices, receipts and the Customer Portal so
   customers only ever see TrueLink.
5. **Customer emails** (Settings → Billing → Subscriptions and emails): turn on
   "Send emails about upcoming renewals" (annual plans), "Send finalized invoices and
   credit notes", "Send emails when card payments fail" and **Smart Retries**.

> Tip: Stripe has a **Test mode / Sandbox** toggle at the top of the Dashboard. Do steps 2 to 4
> there first if you want to practice, then repeat them in live mode.

---

## Step 2: Create every plan in one click (TrueLink HQ)

Open **truelinksolutions.com/hq → Settings → Plans & payments** and click
**Set up plans in Stripe**. HQ uses the Stripe key you already connected and creates:

| Plan | Monthly | Lookup key | Yearly (2 months free) | Lookup key |
|---|---|---|---|---|
| Seed (Church) | $197 / month | `seed_monthly` | $1,970 / year | `seed_annual` |
| Harvest (Church) | $497 / month | `harvest_monthly` | $4,970 / year | `harvest_annual` |
| Legacy (Church) | $997 / month | `legacy_monthly` | $9,970 / year | `legacy_annual` |
| Essentials (Business) | $297 / month | `essentials_monthly` | $2,970 / year | `essentials_annual` |
| Growth (Business) | $697 / month | `growth_monthly` | $6,970 / year | `growth_annual` |
| Partner (Business) | $1,497 / month | `partner_monthly` | $14,970 / year | `partner_annual` |

It also creates:

- **Founders coupons** (forever, Legacy only): `FOUNDERS_MONTHLY` ($200 off a month) and
  `FOUNDERS_ANNUAL` ($2,000 off a year).
- **12 Payment Links**, one per plan and billing period. They collect phone and church/business
  name, and after paying, customers land back on truelinksolutions.com with a welcome message
  and the kickoff-call booking section. The website's "Get started" buttons pick these links up
  automatically. No rebuild needed.
- **Customer Portal**: customers can update their card or bank, see invoices, switch plans
  (monthly ↔ yearly, upgrade or downgrade, prorated), and cancel at the end of the period they
  paid for. The portal's login link appears in HQ. Put it in welcome emails as "Manage billing".

The button is safe to click again. It reuses anything that already exists.

**If it says the key doesn't have permission:** the key in HQ is a *restricted* key (`rk_live_…`).
In Stripe → Developers → API keys, edit that key and set these to **Write**: Products, Prices,
Coupons, Payment Links, Checkout Sessions, Subscriptions, Customers, Customer portal. Save, then
click the button again.

For one-off website-only jobs ($400 simple site, $1,500 full site), keep using
**HQ → Invoices**.

---

## Step 3: Start Healer's House on Founders pricing

Same card in HQ → **Founders pricing**. Healer's House is pre-selected.

1. Pick **$797 / month** or **$7,970 / year** ($797 × 10 months, 2 months free).
2. Choose how they pay:
   - **Create checkout link to send them** (recommended): a secure Stripe page with the
     Founders discount already applied. They pick card or bank, auto-pay is turned on, and the
     subscription starts when they pay. The link works for 24 hours. If they don't use it, just
     make a new one.
   - **Start now and email the invoice**: the subscription starts today, and Stripe emails an
     invoice due in 14 days every billing period. They can pay by card or bank.

Every invoice shows: Legacy $997.00, Founders 20% −$200.00, **total $797.00** (or $9,970.00,
−$2,000.00, **$7,970.00** yearly). The discount is set to "forever", so the price stays locked in.

To switch them from monthly to yearly later: Stripe → the subscription → **Update** → change the
price to `legacy_annual` and the coupon to `FOUNDERS_ANNUAL`. Stripe credits the unused month.

---

## Step 4: Payment methods and emails (Stripe Dashboard)

- Settings → Payments → Payment methods: turn on **ACH Direct Debit**. It costs 0.8% capped at
  $5, which is much cheaper than cards on Legacy and yearly plans.
- Settings → Billing → Subscriptions and emails: turn on renewal reminders for yearly plans,
  failed-payment emails and **Smart Retries**.
- Settings → Branding: TrueLink logo, brand color `#123a66`, accent `#f0821f`.

## Step 5 (phase 2): The TrueLink customer dashboard

Once the steps above are done, this is the plan for the branded login at
`truelinksolutions.com/account` (built on the Supabase project you already use for HQ):

1. **Branded login.** Email + password or a one-time email link, with the TrueLink logo and
   colors. The login emails come from TrueLink through Resend. Customers never see "Supabase".
2. **Sign up → pay → dashboard.** "Get started" sends people to Stripe Checkout with their
   account attached. When payment succeeds, Stripe's webhook (`checkout.session.completed`,
   `customer.subscription.created/updated/deleted`, `invoice.paid`,
   `invoice.payment_failed`) updates a `subscriptions` table in Supabase, so their dashboard
   shows their plan within seconds.
3. **Dashboard v1 pages:** Plan & billing (current plan, next charge, invoices,
   "Manage billing" → Customer Portal), Basic metrics (website visitors, email list, assistant
   questions), Business or church profile (name, address, logo, hours, contacts), Account
   (users, password, notification email).
4. **Legacy and Partner** customers are routed to their own branded dashboard (like
   Healer's House) instead of the shared TrueLink one, based on their plan.

The existing `stripe` edge function and webhook (already set up from HQ → Settings) will be
extended with the subscription events above, so HQ also sees every subscriber automatically.

---

## Fees to expect (Stripe US standard pricing; confirm current rates in your Dashboard)

- Cards: about 2.9% + 30¢ per payment (Harvest monthly ≈ $14.71 per $497).
- ACH bank payments: 0.8%, capped at $5 (Legacy monthly = $5).
- Stripe Billing (subscriptions, invoices, portal): an extra percentage of recurring revenue.
  Check Settings → Billing for your rate.

Encouraging ACH for Legacy, Partner and annual plans saves the most.
