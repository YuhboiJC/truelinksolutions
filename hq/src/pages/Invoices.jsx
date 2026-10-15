import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { stripeAction, supabase } from '@/lib/supabase';
import { date, displayName, money } from '@/lib/format';
import { Empty, InvoiceBadge, PageHeader, Spinner } from '@/components/ui';

const TABS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Outstanding' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

export default function Invoices() {
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = () =>
    supabase.from('invoices').select('*, contact:contacts(id,name,email,business_name)').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const { count } = await stripeAction('sync_all');
      toast.success(`Synced ${count} invoice${count === 1 ? '' : 's'} from Stripe`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const shown = useMemo(() => (rows ?? []).filter((r) => !tab || r.status === tab), [rows, tab]);
  if (!rows) return <Spinner />;

  const outstanding = rows.filter((r) => r.status === 'open').reduce((s, r) => s + r.amount_due - r.amount_paid, 0);
  const paid = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount_paid, 0);

  return (
    <>
      <PageHeader title="Invoices" subtitle={`${money(outstanding)} outstanding · ${money(paid)} collected all time`}>
        <button className="btn btn-outline" onClick={sync} disabled={syncing}><RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />Sync from Stripe</button>
      </PageHeader>
      <p className="text-sm text-slate-500 -mt-3 mb-5">To create an invoice, open a contact and click <strong>New invoice</strong>.</p>

      <div className="card">
        <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)} className={`btn h-8 ${tab === t.value ? 'bg-navy-50 text-navy-700' : 'btn-ghost text-slate-500'}`}>{t.label}</button>
          ))}
        </div>
        {shown.length === 0 ? (
          <Empty icon={FileText} title="No invoices here yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="font-medium px-4 py-2.5">Invoice</th>
                  <th className="font-medium px-4 py-2.5">Customer</th>
                  <th className="font-medium px-4 py-2.5 text-right">Amount</th>
                  <th className="font-medium px-4 py-2.5">Status</th>
                  <th className="font-medium px-4 py-2.5 hidden sm:table-cell">Due / Paid</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.number ?? 'Draft'}</td>
                    <td className="px-4 py-2.5">
                      {r.contact ? <Link to={`/contacts/${r.contact.id}`} className="hover:text-orange-600">{displayName(r.contact)}</Link> : <span className="text-slate-400">Unlinked</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(r.amount_due, r.currency)}</td>
                    <td className="px-4 py-2.5"><InvoiceBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-slate-500 whitespace-nowrap">{r.paid_at ? date(r.paid_at) : date(r.due_date)}</td>
                    <td className="px-4 py-2.5 text-right">{r.hosted_invoice_url && <a href={r.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-navy-500 hover:text-orange-600">View</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
