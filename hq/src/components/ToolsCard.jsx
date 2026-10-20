import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Clock, CreditCard, ExternalLink, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';
import { date, dollars, today } from '@/lib/format';
import { CATEGORIES, CATEGORY, CYCLES, SERVICE_STATUSES, daysUntil, perMonth } from '@/lib/services';
import { Modal, Spinner } from './ui';

const money2 = (n) => (n == null || n === '' ? '' : Number(n) % 1 ? `$${Number(n).toFixed(2)}` : dollars(n));
const per = (c) => (c === 'monthly' ? '/mo' : c === 'yearly' ? '/yr' : '');

function addCycle(from, cycle) {
  const d = new Date(`${from}T12:00:00`);
  if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Paid / coming up / unpaid, from the next bill date and payment setup. */
export function billState(t) {
  if (t.status === 'cancelled') return { key: 'cancelled', label: 'Cancelled', tone: 'bg-slate-100 text-slate-500 ring-slate-200', icon: null };
  if (!['monthly', 'yearly'].includes(t.billing_cycle)) return { key: 'free', label: 'No bill', tone: 'bg-slate-100 text-slate-600 ring-slate-200', icon: null };
  if (!t.renews_on) return { key: 'nodate', label: 'Add next bill date', tone: 'bg-amber-50 text-amber-700 ring-amber-200', icon: CircleAlert };
  const days = daysUntil(t.renews_on);
  const autopays = t.auto_renew && t.payment_connected;
  if (days < 0) return { key: 'unpaid', label: `Unpaid · ${-days} day${days === -1 ? '' : 's'} overdue`, tone: 'bg-red-50 text-red-700 ring-red-200', icon: CircleAlert };
  if (days <= 14) {
    return autopays
      ? { key: 'soon', label: days === 0 ? 'Auto-pays today' : `Auto-pays in ${days} day${days === 1 ? '' : 's'}`, tone: 'bg-blue-50 text-blue-700 ring-blue-200', icon: Clock }
      : { key: 'soon', label: days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'bg-orange-50 text-orange-700 ring-orange-200', icon: Clock };
  }
  return { key: 'paid', label: 'Paid up', tone: 'bg-green-50 text-green-700 ring-green-200', icon: CheckCircle2 };
}

const FIELDS = ['name', 'provider', 'category', 'url', 'login_email', 'who_can_access', 'status', 'billing_cycle', 'our_cost', 'renews_on', 'last_paid_on', 'auto_renew', 'payment_connected', 'payment_method', 'notes'];

function ToolForm({ tool, onClose, onSaved }) {
  const editing = !!tool?.id;
  const [form, setForm] = useState(() => {
    const base = { category: 'software', status: 'active', billing_cycle: 'monthly', auto_renew: true, payment_connected: false, ...tool };
    return Object.fromEntries(FIELDS.map((f) => [f, base[f] ?? (['auto_renew', 'payment_connected'].includes(f) ? false : '')]));
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const paid = ['monthly', 'yearly'].includes(form.billing_cycle);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Give it a name');
    setSaving(true);
    const row = { ...form, contact_id: null, account_owner: 'truelink', name: form.name.trim() };
    for (const k of ['provider', 'url', 'login_email', 'who_can_access', 'renews_on', 'last_paid_on', 'payment_method', 'notes']) row[k] = typeof row[k] === 'string' ? row[k].trim() || null : row[k];
    row.our_cost = row.our_cost === '' || row.our_cost == null ? null : Number(row.our_cost);
    const { error } = editing ? await supabase.from('services').update(row).eq('id', tool.id) : await supabase.from('services').insert(row);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Saved' : 'Tool added');
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!window.confirm(`Remove ${tool.name}? (Tip: set it to Cancelled instead to keep the history.)`)) return;
    const { error } = await supabase.from('services').delete().eq('id', tool.id);
    if (error) return toast.error(error.message);
    onSaved();
    onClose();
  };

  return (
    <Modal title={editing ? `Edit ${tool.name}` : 'Add a tool or platform'} onClose={onClose} wide>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Claude Team, Canva Pro, Hostinger Business hosting" autoFocus /></div>
        <div><label className="label">Company</label><input className="input" value={form.provider} onChange={set('provider')} placeholder="Anthropic, Canva, Hostinger…" /></div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
        </div>

        <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500 -mb-2 mt-1">Logging in</p>
        <div><label className="label">Where to log in</label><input className="input" value={form.url} onChange={set('url')} placeholder="https://" /></div>
        <div><label className="label">Account email</label><input className="input" type="email" value={form.login_email} onChange={set('login_email')} placeholder="info@truelinksolutions.com" /></div>
        <div className="sm:col-span-2"><label className="label">Who can log in</label><input className="input" value={form.who_can_access} onChange={set('who_can_access')} placeholder="e.g. Josh and his wife (shared in Bitwarden), Josh only" /></div>

        <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500 -mb-2 mt-1">Billing</p>
        <div>
          <label className="label">Billing cycle</label>
          <select className="input" value={form.billing_cycle} onChange={set('billing_cycle')}>
            {CYCLES.map((s) => <option key={s.value} value={s.value}>{s.value === 'none' ? 'Free / pay-as-you-go' : s.label}</option>)}
          </select>
        </div>
        <div><label className="label">Cost {paid ? `(per ${form.billing_cycle === 'monthly' ? 'month' : 'year'})` : ''}</label><input className="input" type="number" min="0" step="0.01" value={form.our_cost ?? ''} onChange={set('our_cost')} placeholder="0.00" /></div>
        <div><label className="label">Next bill date</label><input className="input" type="date" value={form.renews_on ?? ''} onChange={set('renews_on')} /></div>
        <div><label className="label">Last paid on</label><input className="input" type="date" value={form.last_paid_on ?? ''} onChange={set('last_paid_on')} /></div>
        <div><label className="label">Payment method</label><input className="input" value={form.payment_method} onChange={set('payment_method')} placeholder="e.g. Business Visa ending 4242" /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>{SERVICE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="accent-orange-500 w-4 h-4" checked={!!form.payment_connected} onChange={set('payment_connected')} />A card or bank account is connected</label>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="accent-orange-500 w-4 h-4" checked={!!form.auto_renew} onChange={set('auto_renew')} />Pays automatically (autopay)</label>
        <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="textarea" rows={2} value={form.notes ?? ''} onChange={set('notes')} placeholder="Plan name, what it's used for, anything your team should know" /></div>
        <p className="sm:col-span-2 text-xs text-slate-500">Don't store passwords here. Keep them in a shared password manager like Bitwarden or 1Password.</p>
        <div className="sm:col-span-2 flex justify-between gap-2">
          {editing ? <button type="button" className="btn btn-danger" onClick={remove}><Trash2 className="w-4 h-4" />Remove</button> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Add'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/** Settings → Tools & platforms: TrueLink's own accounts, bills and logins. */
export default function ToolsCard() {
  const [tools, setTools] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('services').select('*').is('contact_id', null)
      .order('renews_on', { ascending: true, nullsFirst: false }).order('name');
    if (error) toast.error(error.message);
    setTools(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const markPaid = async (t) => {
    const next = ['monthly', 'yearly'].includes(t.billing_cycle) ? addCycle(t.renews_on ?? today(), t.billing_cycle) : t.renews_on;
    const { error } = await supabase.from('services').update({ last_paid_on: today(), renews_on: next }).eq('id', t.id);
    if (error) return toast.error(error.message);
    toast.success(`${t.name} marked paid. Next bill ${date(next)}.`);
    load();
  };

  if (!tools) return <section className="card p-5 lg:col-span-2"><Spinner /></section>;

  const live = tools.filter((t) => t.status !== 'cancelled');
  const shown = showCancelled ? tools : live;
  const states = live.map(billState);
  const monthly = live.reduce((s, t) => s + perMonth(t.our_cost, t.billing_cycle), 0);
  const unpaid = states.filter((s) => s.key === 'unpaid').length;
  const soon = states.filter((s) => s.key === 'soon').length;
  const noPayment = live.filter((t) => ['monthly', 'yearly'].includes(t.billing_cycle) && !t.payment_connected).length;

  return (
    <section className="card lg:col-span-2 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="font-semibold">Tools &amp; platforms</h2>
          <p className="text-sm text-slate-500 mt-0.5">Everything TrueLink pays for or logs into: what it costs, when it bills, whether it's paid, and how to get in.</p>
        </div>
        <button className="btn btn-primary shrink-0" onClick={() => setEditing({})}><Plus className="w-4 h-4" />Add tool</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 mt-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs text-slate-500">Monthly total</p><p className="font-bold text-navy-900">{money2(Math.round(monthly * 100) / 100) || '$0'}</p></div>
        <div className={clsx('rounded-lg px-3 py-2', unpaid ? 'bg-red-50' : 'bg-slate-50')}><p className="text-xs text-slate-500">Unpaid / overdue</p><p className={clsx('font-bold', unpaid ? 'text-red-700' : 'text-navy-900')}>{unpaid}</p></div>
        <div className={clsx('rounded-lg px-3 py-2', soon ? 'bg-orange-50' : 'bg-slate-50')}><p className="text-xs text-slate-500">Billing in 14 days</p><p className={clsx('font-bold', soon ? 'text-orange-700' : 'text-navy-900')}>{soon}</p></div>
        <div className={clsx('rounded-lg px-3 py-2', noPayment ? 'bg-amber-50' : 'bg-slate-50')}><p className="text-xs text-slate-500">No payment method</p><p className={clsx('font-bold', noPayment ? 'text-amber-700' : 'text-navy-900')}>{noPayment}</p></div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left font-medium px-5 py-2">Tool</th>
              <th className="text-left font-medium px-3 py-2">Cost</th>
              <th className="text-left font-medium px-3 py-2">Next bill</th>
              <th className="text-left font-medium px-3 py-2">Payment</th>
              <th className="text-left font-medium px-3 py-2">Login</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((t) => {
              const st = billState(t);
              const Icon = CATEGORY[t.category]?.icon;
              const billable = ['monthly', 'yearly'].includes(t.billing_cycle);
              return (
                <tr key={t.id} className={clsx('hover:bg-slate-50 cursor-pointer', t.status === 'cancelled' && 'opacity-50')} onClick={() => setEditing(t)}>
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4 text-navy-400 shrink-0" />}
                      <span className="min-w-0">
                        <span className="block font-medium text-navy-900 truncate max-w-64">{t.name}</span>
                        {t.provider && <span className="block text-xs text-slate-400">{t.provider}</span>}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{t.our_cost != null && Number(t.our_cost) > 0 ? `${money2(t.our_cost)}${per(t.billing_cycle)}` : billable ? <span className="text-amber-600">Add cost</span> : 'Free'}</td>
                  <td className="px-3 py-2.5">
                    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', st.tone)}>
                      {st.icon && <st.icon className="w-3.5 h-3.5" />}{st.label}
                    </span>
                    {t.renews_on && billable && <span className="block text-xs text-slate-400 mt-0.5">{date(t.renews_on)}{t.last_paid_on ? ` · paid ${date(t.last_paid_on).replace(/, \d{4}$/, '')}` : ''}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {billable ? (
                      t.payment_connected
                        ? <span className="inline-flex items-center gap-1 text-green-700"><CreditCard className="w-3.5 h-3.5" />{t.payment_method || 'Connected'}{t.auto_renew ? ' · autopay' : ''}</span>
                        : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="w-3.5 h-3.5" />Not connected</span>
                    ) : <span className="text-slate-400">n/a</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      {t.url && <a href={t.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-navy-600 hover:text-orange-600" title="Open login page"><ExternalLink className="w-3.5 h-3.5" /></a>}
                      <span className="truncate max-w-48">{t.login_email || <span className="text-slate-400">Add account email</span>}</span>
                    </span>
                    {t.who_can_access && <span className="block text-slate-400 truncate max-w-56">{t.who_can_access}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    {billable && t.status !== 'cancelled' && (['unpaid', 'nodate'].includes(st.key) || (st.key === 'soon' && !(t.auto_renew && t.payment_connected))) && (
                      <button className="btn btn-outline h-7 px-2 text-xs whitespace-nowrap" onClick={() => markPaid(t)}><RefreshCw className="w-3.5 h-3.5" />Mark paid</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span>&ldquo;Mark paid&rdquo; records today's payment and moves the next bill date ahead one cycle. Upcoming bills are also in the daily renewal email.</span>
        {tools.length !== live.length && <button className="underline" onClick={() => setShowCancelled(!showCancelled)}>{showCancelled ? 'Hide' : 'Show'} cancelled</button>}
      </div>
      {editing && <ToolForm tool={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={load} />}
    </section>
  );
}
