import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { stripeAction, supabase } from '@/lib/supabase';

const PLAN_ROWS = [
  ['seed', 'Seed (Church)', 197],
  ['harvest', 'Harvest (Church)', 497],
  ['legacy', 'Legacy (Church)', 997],
  ['essentials', 'Essentials (Business)', 297],
  ['growth', 'Growth (Business)', 697],
  ['partner', 'Partner (Business)', 1497],
];
const money = (n) => `$${n.toLocaleString('en-US')}`;

function copy(text) {
  navigator.clipboard?.writeText(text).then(() => toast.success('Link copied'), () => toast.error('Could not copy'));
}

function LinkButtons({ url }) {
  if (!url) return <span className="text-slate-400">Not set up</span>;
  return (
    <span className="inline-flex gap-1">
      <button type="button" className="btn btn-ghost h-7 px-2" onClick={() => copy(url)} title="Copy link"><Copy className="w-3.5 h-3.5" /></button>
      <a className="btn btn-ghost h-7 px-2" href={url} target="_blank" rel="noreferrer" title="Open"><ExternalLink className="w-3.5 h-3.5" /></a>
    </span>
  );
}

/** Settings → Plans & payments: creates the Stripe catalog and starts Founders billing. */
export default function PlansCard({ status, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [starting, setStarting] = useState('');
  const [result, setResult] = useState(null);

  const links = status?.plans?.links ?? {};
  const portal = status?.plans?.portal;
  const ready = PLAN_ROWS.every(([id]) => links[id]?.monthly && links[id]?.annual);

  useEffect(() => {
    supabase
      .from('contacts')
      .select('id,name,business_name,email,status')
      .in('status', ['customer', 'prospect', 'lead'])
      .order('business_name')
      .then(({ data }) => {
        const list = (data ?? []).filter((c) => c.email);
        setContacts(list);
        const hh = list.find((c) => /healer/i.test(`${c.business_name} ${c.name}`));
        if (hh) setContactId(hh.id);
      });
  }, []);

  const setup = async () => {
    setBusy(true);
    try {
      const r = await stripeAction('setup_plans');
      toast.success('Plans, prices, Founders coupons and payment links are ready in Stripe');
      if (r.portal_error) toast.warning(`Customer portal: ${r.portal_error}`);
      onChanged?.();
    } catch (e) {
      toast.error(e.message, { duration: 12000 });
    } finally {
      setBusy(false);
    }
  };

  const startFounders = async (method) => {
    const c = contacts.find((x) => x.id === contactId);
    const amount = period === 'annual' ? '$7,970.00 a year' : '$797.00 a month';
    const how = method === 'invoice'
      ? `Stripe will email an invoice for ${amount} to ${c?.email} now, then every ${period === 'annual' ? 'year' : 'month'}.`
      : `This creates a secure checkout link for ${amount} that you can send them. It works for 24 hours.`;
    if (!window.confirm(`Start the Legacy Founders plan for ${c?.business_name || c?.name}?\n\n${how}`)) return;
    setStarting(method);
    setResult(null);
    try {
      const r = await stripeAction('start_founders', { contact_id: contactId, period, method });
      setResult({ method, ...r });
      toast.success(method === 'invoice' ? 'Subscription started. Stripe is emailing the first invoice.' : 'Checkout link ready');
    } catch (e) {
      toast.error(e.message, { duration: 12000 });
    } finally {
      setStarting('');
    }
  };

  return (
    <section className="card p-5 lg:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Plans &amp; payments</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monthly and yearly (2 months free) prices for every TrueLink plan, with a Stripe payment link for each.
            The website's "Get started" buttons use these links automatically.
          </p>
        </div>
        <button className="btn btn-navy shrink-0" onClick={setup} disabled={busy || !status?.connected}>
          {busy ? 'Setting up…' : ready ? 'Re-check plans in Stripe' : 'Set up plans in Stripe'}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="py-2 font-medium">Plan</th>
              <th className="py-2 font-medium">Monthly</th>
              <th className="py-2 font-medium">Yearly</th>
            </tr>
          </thead>
          <tbody>
            {PLAN_ROWS.map(([id, name, monthly]) => (
              <tr key={id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 font-medium text-navy-900">
                  <span className="inline-flex items-center gap-1.5">
                    {links[id]?.monthly && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {name}
                  </span>
                </td>
                <td className="py-2"><span className="inline-flex items-center gap-2">{money(monthly)}/mo <LinkButtons url={links[id]?.monthly} /></span></td>
                <td className="py-2"><span className="inline-flex items-center gap-2">{money(monthly * 10)}/yr <LinkButtons url={links[id]?.annual} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {portal && (
        <p className="text-sm text-slate-500 mt-3 flex flex-wrap items-center gap-2">
          Customer billing login (change card, switch plans, cancel):
          <a className="text-navy-600 underline break-all" href={portal} target="_blank" rel="noreferrer">{portal}</a>
          <button type="button" className="btn btn-ghost h-7 px-2" onClick={() => copy(portal)}><Copy className="w-3.5 h-3.5" /></button>
        </p>
      )}

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <h3 className="font-semibold text-navy-900">Founders pricing (Legacy, 20% off for life)</h3>
        <p className="text-sm text-slate-600 mt-1">
          Monthly: $997.00 − $200.00 = <b>$797.00/month</b>. Yearly: $9,970.00 − $2,000.00 = <b>$7,970.00/year</b>
          {' '}($797 × 10 months, 2 months free). Invoices show the regular price and the Founders discount on separate lines.
        </p>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mt-4 items-end">
          <div>
            <label className="label" htmlFor="founders-contact">Customer</label>
            <select id="founders-contact" className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">Choose a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.business_name || c.name} ({c.email})</option>
              ))}
            </select>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Billing period">
            {[['monthly', '$797 / month'], ['annual', '$7,970 / year']].map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={period === v}
                onClick={() => setPeriod(v)}
                className={`rounded-md px-3 h-9 text-sm font-semibold ${period === v ? 'bg-navy-600 text-white' : 'text-navy-700 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn btn-primary" disabled={!contactId || !!starting || !ready} onClick={() => startFounders('checkout')}>
            {starting === 'checkout' ? 'Creating…' : 'Create checkout link to send them'}
          </button>
          <button className="btn btn-outline" disabled={!contactId || !!starting || !ready} onClick={() => startFounders('invoice')}>
            {starting === 'invoice' ? 'Starting…' : 'Start now and email the invoice'}
          </button>
        </div>
        {!ready && <p className="text-xs text-slate-500 mt-2">Set up plans in Stripe first.</p>}
        <p className="text-xs text-slate-500 mt-2">
          Checkout link: they choose card or bank, auto-pay is turned on, and the subscription starts when they pay (link works for 24 hours).
          Invoice: the subscription starts today and Stripe emails an invoice due in 14 days, every billing period.
        </p>
        {result?.url && (
          <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3 text-sm">
            <p className="font-medium text-navy-900 mb-1">Send this link to them (expires in 24 hours):</p>
            <div className="flex items-center gap-2">
              <code className="truncate flex-1">{result.url}</code>
              <button type="button" className="btn btn-outline h-8" onClick={() => copy(result.url)}><Copy className="w-3.5 h-3.5" /> Copy</button>
            </div>
          </div>
        )}
        {result?.subscription && (
          <p className="mt-3 text-sm text-emerald-700">Subscription {result.subscription} started. The invoice will appear under Invoices in a moment.</p>
        )}
      </div>
    </section>
  );
}
