import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CalendarClock, CircleDollarSign, Plus, RefreshCw, Server, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { opsAction, supabase } from '@/lib/supabase';
import { dateTime, displayName, dollars } from '@/lib/format';
import { CATEGORIES, daysUntil, perMonth } from '@/lib/services';
import ServiceForm from '@/components/ServiceForm';
import ServiceRows from '@/components/ServiceRows';
import { Empty, PageHeader, Spinner } from '@/components/ui';

const INTERNAL = '__internal';

export default function Services() {
  const [services, setServices] = useState(null);
  const [status, setStatus] = useState(null);
  const [editing, setEditing] = useState(null);
  const [customer, setCustomer] = useState('');
  const [category, setCategory] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('services')
      .select('*, contact:contacts(id,name,email,business_name)')
      .order('renews_on', { ascending: true, nullsFirst: false }).order('name');
    if (error) toast.error(error.message);
    setServices(data ?? []);
  }, []);
  useEffect(() => {
    load();
    opsAction('status').then(setStatus).catch(() => setStatus({}));
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await opsAction('sync_hostinger');
      toast.success(`Hostinger synced: ${r.added} added, ${r.updated} updated`);
      load();
      opsAction('status').then(setStatus);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const sendDigest = async () => {
    setSending(true);
    try {
      const r = await opsAction('send_renewal_digest');
      toast.success(r.sent ? `Emailed a list of ${r.due} upcoming renewal${r.due === 1 ? '' : 's'}` : 'Nothing renews in the next 60 days');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const customers = useMemo(() => {
    const m = new Map();
    (services ?? []).forEach((s) => s.contact && m.set(s.contact.id, s.contact));
    return [...m.values()].sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }, [services]);

  if (!services) return <Spinner />;

  const live = services.filter((s) => s.status !== 'cancelled');
  const revenue = live.reduce((t, s) => t + perMonth(s.client_price, s.billing_cycle), 0);
  const cost = live.reduce((t, s) => t + perMonth(s.our_cost, s.billing_cycle), 0);
  const soon = live.filter((s) => { const d = daysUntil(s.renews_on); return d != null && d <= 60; });
  const attention = soon.filter((s) => !(s.auto_renew && s.account_owner === 'truelink'));

  const shown = services.filter((s) =>
    (showCancelled || s.status !== 'cancelled') &&
    (!category || s.category === category) &&
    (!customer || (customer === INTERNAL ? !s.contact_id : s.contact_id === customer)));

  const groups = new Map();
  shown.forEach((s) => {
    const key = s.contact?.id ?? INTERNAL;
    if (!groups.has(key)) groups.set(key, { contact: s.contact, items: [] });
    groups.get(key).items.push(s);
  });
  const ordered = [...groups.entries()].sort(([a, ga], [b, gb]) =>
    a === INTERNAL ? 1 : b === INTERNAL ? -1 : displayName(ga.contact).localeCompare(displayName(gb.contact)));

  return (
    <>
      <PageHeader title="Services & Renewals" subtitle="Hosting, domains, websites, AI agents and everything else you manage, in one place.">
        {status?.hostinger ? (
          <button className="btn btn-outline" onClick={sync} disabled={syncing}><RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />{syncing ? 'Syncing…' : 'Sync Hostinger'}</button>
        ) : status && (
          <Link className="btn btn-outline" to="/settings"><Server className="w-4 h-4" />Connect Hostinger</Link>
        )}
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus className="w-4 h-4" />Add service</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Tile icon={CircleDollarSign} label="Recurring revenue" value={`${dollars(revenue)}/mo`} hint="What clients pay for active services" />
        <Tile icon={Wallet} label="Your costs" value={`${dollars(cost)}/mo`} hint="Hosting, domains and tools, averaged" />
        <Tile icon={CalendarClock} label="Renewing in 60 days" value={soon.length} hint={soon.length ? 'Email reminders go out automatically' : 'Nothing coming up'} />
        <Tile icon={BellRing} label="Need your action" value={attention.length} hint="Renew, pay or transfer by hand" warn={attention.length > 0} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input w-auto" value={customer} onChange={(e) => setCustomer(e.target.value)} aria-label="Customer">
          <option value="">All customers</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{displayName(c)}</option>)}
          <option value={INTERNAL}>TrueLink (internal)</option>
        </select>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Type">
          <option value="">All types</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 px-1">
          <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
          Show cancelled
        </label>
      </div>

      {ordered.length === 0 ? (
        <div className="card"><Empty icon={Server} title="Nothing here yet">Add a website, domain, hosting plan or AI agent you manage.</Empty></div>
      ) : (
        <div className="space-y-6">
          {ordered.map(([key, g]) => (
            <section key={key} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3 bg-slate-50/70 border-b border-slate-100">
                {g.contact ? (
                  <Link to={`/contacts/${g.contact.id}`} className="font-semibold text-navy-900 hover:text-orange-600 truncate">{displayName(g.contact)}</Link>
                ) : <p className="font-semibold text-navy-900">TrueLink (internal)</p>}
                <span className="text-xs text-slate-500 shrink-0">{g.items.length} item{g.items.length === 1 ? '' : 's'}</span>
              </div>
              <ServiceRows services={g.items} onEdit={setEditing} />
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span>Renewal reminders are emailed at 60, 30, 14, 7, 3 and 1 days out.</span>
        {status?.last_sync && <span>Hostinger last synced {dateTime(status.last_sync)}.</span>}
        <button className="underline hover:text-navy-700" onClick={sendDigest} disabled={sending}>{sending ? 'Sending…' : 'Email me the upcoming list now'}</button>
      </div>

      {editing && <ServiceForm service={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={load} />}
    </>
  );
}

function Tile({ icon: Icon, label, value, hint, warn }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className={`w-4 h-4 ${warn ? 'text-rose-500' : 'text-orange-500'}`} />{label}</div>
      <p className={`text-2xl font-bold mt-2 tabular-nums ${warn ? 'text-rose-600' : 'text-navy-900'}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
