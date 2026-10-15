import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, CircleDollarSign, Inbox, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { date, dateTime, displayName, money, today } from '@/lib/format';
import { Empty, PageHeader, Spinner, StatusBadge } from '@/components/ui';

function Stat({ icon: Icon, label, value, hint, to }) {
  const body = (
    <div className="card p-4 h-full hover:border-navy-100 transition-colors">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="w-4 h-4 text-orange-500" />{label}</div>
      <p className="text-2xl font-bold text-navy-900 mt-2 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [contacts, invoices, followUps, activity] = await Promise.all([
        supabase.from('contacts').select('id,status,created_at,subscribed'),
        supabase.from('invoices').select('status,amount_due,amount_paid,paid_at'),
        supabase.from('contacts').select('id,name,email,business_name,status,next_follow_up').lte('next_follow_up', today()).not('status', 'in', '(lost,past)').order('next_follow_up').limit(8),
        supabase.from('activities').select('id,type,body,created_at,contact:contacts(id,name,email,business_name)').order('created_at', { ascending: false }).limit(12),
      ]);
      const c = contacts.data ?? [];
      const inv = invoices.data ?? [];
      setData({
        leads: c.filter((x) => x.status === 'lead' || x.status === 'prospect').length,
        customers: c.filter((x) => x.status === 'customer').length,
        newThisWeek: c.filter((x) => x.created_at >= weekAgo).length,
        subscribers: c.filter((x) => x.subscribed).length,
        outstanding: inv.filter((x) => x.status === 'open').reduce((s, x) => s + x.amount_due - x.amount_paid, 0),
        openCount: inv.filter((x) => x.status === 'open').length,
        paidMonth: inv.filter((x) => x.status === 'paid' && x.paid_at && new Date(x.paid_at) >= monthStart).reduce((s, x) => s + x.amount_paid, 0),
        followUps: followUps.data ?? [],
        activity: activity.data ?? [],
      });
    })();
  }, []);

  if (!data) return <Spinner />;

  return (
    <>
      <PageHeader title="Overview" subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat icon={UserPlus} label="Open leads" value={data.leads} hint={`${data.newThisWeek} new this week`} to="/pipeline" />
        <Stat icon={Users} label="Active customers" value={data.customers} hint={`${data.subscribers} on email list`} to="/contacts?status=customer" />
        <Stat icon={Inbox} label="Outstanding" value={money(data.outstanding)} hint={`${data.openCount} open invoice${data.openCount === 1 ? '' : 's'}`} to="/invoices" />
        <Stat icon={CircleDollarSign} label="Paid this month" value={money(data.paidMonth)} to="/invoices" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="card lg:col-span-2">
          <h2 className="px-5 pt-4 pb-3 text-sm font-semibold flex items-center gap-2"><AlarmClock className="w-4 h-4 text-orange-500" />Follow up today</h2>
          {data.followUps.length === 0 ? (
            <Empty title="You're all caught up">Set a follow-up date on any contact to see it here.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.followUps.map((c) => (
                <li key={c.id}>
                  <Link to={`/contacts/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{displayName(c)}</p>
                      <p className={`text-xs ${c.next_follow_up < today() ? 'text-rose-600' : 'text-slate-500'}`}>
                        {c.next_follow_up < today() ? 'Overdue · ' : ''}{date(c.next_follow_up)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-3">
          <h2 className="px-5 pt-4 pb-3 text-sm font-semibold">Recent activity</h2>
          {data.activity.length === 0 ? (
            <Empty title="No activity yet">New sign-ups and audit requests from the website will show up here.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.activity.map((a) => (
                <li key={a.id}>
                  <Link to={`/contacts/${a.contact?.id}`} className="block px-5 py-3 hover:bg-slate-50">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-medium truncate">{displayName(a.contact)}</p>
                      <p className="text-xs text-slate-400 shrink-0">{dateTime(a.created_at)}</p>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-line">{a.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
