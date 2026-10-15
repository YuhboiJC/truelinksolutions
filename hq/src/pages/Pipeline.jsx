import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SOURCE, STATUSES, date, displayName, dollars, today } from '@/lib/format';
import ContactForm from '@/components/ContactForm';
import { PageHeader, Spinner } from '@/components/ui';

const COLUMNS = STATUSES.filter((s) => s.value !== 'past');

export default function Pipeline() {
  const [contacts, setContacts] = useState(null);
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState(null);

  const load = () =>
    supabase.from('contacts').select('id,name,email,business_name,status,source,estimated_value,next_follow_up,created_at')
      .neq('status', 'past').order('created_at', { ascending: false })
      .then(({ data }) => setContacts(data ?? []));
  useEffect(() => { load(); }, []);

  const move = async (id, status) => {
    const prev = contacts;
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    const { error } = await supabase.from('contacts').update({ status }).eq('id', id);
    if (error) { setContacts(prev); toast.error(error.message); }
  };

  if (!contacts) return <Spinner />;

  return (
    <>
      <PageHeader title="Pipeline" subtitle="Drag cards between columns, or change status from the dropdown.">
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" />New contact</button>
      </PageHeader>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {COLUMNS.map((col) => {
          const items = contacts.filter((c) => c.status === col.value);
          const value = items.reduce((s, c) => s + (Number(c.estimated_value) || 0), 0);
          return (
            <div
              key={col.value}
              className="w-72 shrink-0 rounded-xl bg-slate-100/70 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) move(dragId, col.value); setDragId(null); }}
            >
              <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                <p className="text-sm font-semibold text-navy-700">{col.label} <span className="text-slate-400 font-normal">{items.length}</span></p>
                {value > 0 && <p className="text-xs text-slate-500">{dollars(value)}</p>}
              </div>
              <div className="space-y-2 min-h-16">
                {items.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    className="card p-3 cursor-grab active:cursor-grabbing"
                  >
                    <Link to={`/contacts/${c.id}`} className="block">
                      <p className="text-sm font-medium text-navy-900 truncate hover:text-orange-600">{displayName(c)}</p>
                      {c.business_name && c.name && <p className="text-xs text-slate-500 truncate">{c.business_name}</p>}
                    </Link>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-[11px] text-slate-400 truncate">{SOURCE[c.source]?.label}</span>
                      {c.next_follow_up && (
                        <span className={`text-[11px] ${c.next_follow_up <= today() ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>Follow up {date(c.next_follow_up)}</span>
                      )}
                    </div>
                    <select
                      className="mt-2 w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600"
                      value={c.status}
                      onChange={(e) => move(c.id, e.target.value)}
                      aria-label="Change status"
                    >
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {adding && <ContactForm onClose={() => setAdding(false)} onSaved={load} />}
    </>
  );
}
