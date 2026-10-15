import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Plus, Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SOURCE, SOURCES, STATUSES, date, displayName } from '@/lib/format';
import ContactForm from '@/components/ContactForm';
import { Empty, PageHeader, Spinner, StatusBadge } from '@/components/ui';

function toCsv(rows) {
  const cols = ['name', 'email', 'phone', 'business_name', 'status', 'source', 'subscribed', 'next_follow_up', 'created_at'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export default function Contacts() {
  const [params, setParams] = useSearchParams();
  const [contacts, setContacts] = useState(null);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const status = params.get('status') ?? '';
  const source = params.get('source') ?? '';

  const load = () =>
    supabase.from('contacts').select('*').order('created_at', { ascending: false }).then(({ data }) => setContacts(data ?? []));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (contacts ?? []).filter((c) =>
      (!status || c.status === status) &&
      (!source || c.source === source) &&
      (!term || [c.name, c.email, c.business_name, c.phone, ...(c.tags ?? [])].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [contacts, q, status, source]);

  const setFilter = (k) => (e) => {
    const next = new URLSearchParams(params);
    e.target.value ? next.set(k, e.target.value) : next.delete(k);
    setParams(next, { replace: true });
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `truelink-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!contacts) return <Spinner />;

  return (
    <>
      <PageHeader title="Contacts" subtitle={`${contacts.length} total · ${contacts.filter((c) => c.subscribed).length} on your email list`}>
        <button className="btn btn-outline" onClick={exportCsv}><Download className="w-4 h-4" />Export</button>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" />New contact</button>
      </PageHeader>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-2 p-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="input pl-9" placeholder="Search name, email, business, tag…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input sm:w-40" value={status} onChange={setFilter('status')}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input sm:w-44" value={source} onChange={setFilter('source')}>
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <Empty icon={Users} title={contacts.length ? 'No matches' : 'No contacts yet'}>
            {contacts.length ? 'Try a different search or filter.' : 'Sign-ups and audit requests from your website land here automatically.'}
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="font-medium px-4 py-2.5">Name</th>
                  <th className="font-medium px-4 py-2.5 hidden md:table-cell">Business</th>
                  <th className="font-medium px-4 py-2.5">Status</th>
                  <th className="font-medium px-4 py-2.5 hidden lg:table-cell">Source</th>
                  <th className="font-medium px-4 py-2.5 hidden sm:table-cell">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/contacts/${c.id}`} className="block">
                        <p className="font-medium text-navy-900 hover:text-orange-600">{displayName(c)}</p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-slate-600">{c.business_name}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-slate-500">{SOURCE[c.source]?.label}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-slate-500 whitespace-nowrap">{date(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {adding && <ContactForm onClose={() => setAdding(false)} onSaved={load} />}
    </>
  );
}
