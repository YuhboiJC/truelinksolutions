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

## Step 2: Create the products and prices

Product catalog → **+ Add product**. Create one product per plan with **two recurring prices**.
Set the **Lookup key** on each price (under "Advanced"). The website and dashboard will use
these keys, so you can change prices later without touching code.

| Product name | Monthly price | Lookup key | Yearly price | Lookup key |
|---|---|---|---|---|
| Seed (Church) | $197 / month | `seed_monthly` | $1,970 / year | `seed_annual` |
| Harvest (Church) | $497 / month | `harvest_monthly` | $4,970 / year | `harvest_annual` |
| Legacy (Church) | $997 / month | `legacy_monthly` | $9,970 / year | `legacy_annual` |
| Essentials (Business) | $297 / month | `essentials_monthly` | $2,970 / year | `essentials_annual` |
| Growth (Business) | $697 / month | `growth_monthly` | $6,970 / year | `growth_annual` |
| Partner (Business) | $1,497 / month | `partner_monthly` | $14,970 / year | `partner_annual` |

Yearly = 10 × monthly ("two months free", about 17% off), the same discount SocialSermons uses.

No setup-fee products are needed. For one-off website-only jobs ($400 simple site, $1,500 full
site), keep using **TrueLink HQ → Invoices**, which already creates one-time Stripe invoices.

---

## Step 3: Create the Founders coupons (Healer's House)

Product catalog → **Coupons** → **+ New**. Create two, both with **Duration: Forever** so the
price stays locked in:

| Coupon name | ID | Type | Amount | Applies to |
|---|---|---|---|---|
| Founders 20% (monthly) | `FOUNDERS_MONTHLY` | Fixed amount | $200.00 | Legacy (Church) |
| Founders 20% (annual) | `FOUNDERS_ANNUAL` | Fixed amount | $2,000.00 | Legacy (Church) |

Result on every invoice: Legacy $997.00, Founders discount −$200.00, **total $797.00/month**.
Annual: $9,970.00, −$2,000.00, **total $7,970.00/year** ($664.17/month).

Fixed amounts are used instead of "20% off" so the totals land on exactly $797 and $7,970.

---

## Step 4: Bill Healer's House

1. Customers → find (or add) Healer's House Family Church, with the billing email they want.
2. **+ Create subscription** → product **Legacy (Church)** → choose the monthly or yearly price,
   whichever they pick.
3. **Add coupon** → `FOUNDERS_MONTHLY` or `FOUNDERS_ANNUAL` to match.
4. **Payment**: choose "Email invoice to the customer" so they can pay by bank (ACH) or card.
   After the first payment they can turn on auto-pay from the invoice page.
5. Set the start date (for example, the 1st of next month) and **Create subscription**.

If they switch from monthly to yearly later: open the subscription → **Update** → change the
price to `legacy_annual` and the coupon to `FOUNDERS_ANNUAL`. Stripe credits the unused month.

---

## Step 5: Turn on the Customer Portal (upgrade, downgrade, cancel)

Settings → Billing → **Customer portal**:

- **Invoices**: show invoice history ✓
- **Customer information**: allow updating email, billing address, tax ID ✓
- **Payment methods**: allow updating ✓
- **Subscriptions → Cancel**: allow ✓, "At end of billing period" (no refunds needed, matches
  "cancel anytime"), ask for a cancellation reason ✓
- **Subscriptions → Switch plans**: allow ✓, add all six products, and both monthly and
  yearly prices. Set "Prorate charges and credits" for upgrades.
  Tip: list the church plans and business plans in separate portal configurations if you don't
  want a church switching to a business plan. To start, one configuration is fine.
- **Business information**: privacy policy and terms links (truelinksolutions.com).
- **Login link**: turn on **"Share a link to the portal"**. Copy that link.

That login link lets any customer manage billing **today**, before the TrueLink dashboard
exists: they enter their email, Stripe emails them a code, and they're in. Put it in your
welcome email and the website footer as "Manage billing".

---

## Step 6: Put sign-up buttons on the website (Payment Links)

Payment Links → **+ New** → choose a product's price. For each of the 12 prices (6 plans ×
monthly/yearly):

- **After payment**: "Don't show confirmation page" → redirect to
  `https://truelinksolutions.com/?welcome=1#book-call` (so new customers book their kickoff
  call right away).
- **Options**: collect the customer's phone number ✓, allow promotion codes ✓ (handy for
  future specials), collect billing address ✓.
- Optional: **Custom field** "Church or business name".

Then paste each link into `web/src/components/pricing/data.js` under `CHECKOUT_LINKS`, for
example:

```js
harvest: { monthly: 'https://buy.stripe.com/abc123', annual: 'https://buy.stripe.com/def456' },
```

Rebuild (`./build.sh`) and upload. Any plan with a link shows **"Get started with Harvest"**;
plans without one keep **"Start with a free audit"**. You can switch on only some plans (for
example, churches first) and leave the rest as free audits.

Should every plan be self-serve? Most agencies at this price keep the top tier (Legacy,
Partner) as "book a call first", because "starts at" pricing may change for bigger clients.
Seed, Harvest, Essentials and Growth work well as instant sign-ups.

---

## Step 7 (phase 2): The TrueLink customer dashboard

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
