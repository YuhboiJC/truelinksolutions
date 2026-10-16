import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { displayName } from '@/lib/format';
import { CATEGORIES, CYCLES, OWNERS, SERVICE_STATUSES } from '@/lib/services';
import { Modal } from './ui';

const FIELDS = ['contact_id', 'category', 'name', 'provider', 'url', 'status', 'account_owner', 'billing_cycle', 'renews_on', 'auto_renew', 'our_cost', 'client_price', 'notes'];

export default function ServiceForm({ service, contactId, onClose, onSaved }) {
  const editing = !!service?.id;
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(() => {
    const base = { category: 'website', status: 'active', account_owner: 'truelink', billing_cycle: 'monthly', auto_renew: true, contact_id: contactId ?? '', ...service };
    return Object.fromEntries(FIELDS.map((f) => [f, base[f] ?? (f === 'auto_renew' ? true : '')]));
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    supabase.from('contacts').select('id,name,email,business_name,status').in('status', ['customer', 'prospect', 'past'])
      .order('business_name').then(({ data }) => setContacts(data ?? []));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Give it a name');
    setSaving(true);
    const row = { ...form };
    for (const k of ['contact_id', 'provider', 'url', 'renews_on', 'notes']) row[k] = typeof row[k] === 'string' ? row[k].trim() || null : row[k];
    for (const k of ['our_cost', 'client_price']) row[k] = row[k] === '' || row[k] == null ? null : Number(row[k]);
    row.name = row.name.trim();
    const q = editing ? supabase.from('services').update(row).eq('id', service.id) : supabase.from('services').insert(row);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Saved' : 'Service added');
    onSaved?.();
    onClose();
  };

  const remove = async () => {
    if (!window.confirm(`Remove "${service.name}" from the tracker? (Tip: set it to Cancelled instead to keep the history.)`)) return;
    const { error } = await supabase.from('services').delete().eq('id', service.id);
    if (error) return toast.error(error.message);
    toast.success('Removed');
    onSaved?.();
    onClose();
  };

  const charged = form.billing_cycle === 'monthly' || form.billing_cycle === 'yearly';

  return (
    <Modal title={editing ? 'Edit service' : 'Add a service'} onClose={onClose} wide>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="e.g. healershouse.org, Website hosting, Sermon to Content agent" autoFocus /></div>
        <div>
          <label className="label">Customer</label>
          <select className="input" value={form.contact_id ?? ''} onChange={set('contact_id')}>
            <option value="">TrueLink (internal)</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{displayName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div><label className="label">Provider</label><input className="input" value={form.provider} onChange={set('provider')} placeholder="Hostinger, Wix, Vercel, Claude…" /></div>
        <div><label className="label">Link</label><input className="input" value={form.url} onChange={set('url')} placeholder="https://" /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {SERVICE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Whose account is it on?</label>
          <select className="input" value={form.account_owner} onChange={set('account_owner')}>
            {OWNERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Billing</label>
          <select className="input" value={form.billing_cycle} onChange={set('billing_cycle')}>
            {CYCLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Renews / expires on</label>
          <input className="input" type="date" value={form.renews_on ?? ''} onChange={set('renews_on')} />
        </div>
        <div><label className="label">Our cost {charged ? `(per ${form.billing_cycle === 'monthly' ? 'month' : 'year'})` : ''}</label><input className="input" type="number" min="0" step="0.01" value={form.our_cost ?? ''} onChange={set('our_cost')} placeholder="0.00" /></div>
        <div><label className="label">We charge the client {charged ? `(per ${form.billing_cycle === 'monthly' ? 'month' : 'year'})` : ''}</label><input className="input" type="number" min="0" step="0.01" value={form.client_price ?? ''} onChange={set('client_price')} placeholder="0.00" /></div>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={!!form.auto_renew} onChange={set('auto_renew')} className="accent-orange-500 w-4 h-4" />
          Renews automatically (uncheck if someone has to renew, pay or transfer it by hand)
        </label>
        <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="textarea" rows={3} value={form.notes ?? ''} onChange={set('notes')} placeholder="Login location, plan details, next steps…" /></div>
        <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
          {editing ? <button type="button" className="btn btn-danger" onClick={remove}><Trash2 className="w-4 h-4" />Remove</button> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Add service'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
