import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SOURCES, STATUSES } from '@/lib/format';
import { Modal } from './ui';

const FIELDS = ['name', 'email', 'phone', 'business_name', 'website', 'status', 'source', 'estimated_value', 'next_follow_up', 'tags'];

export default function ContactForm({ contact, onClose, onSaved }) {
  const editing = !!contact?.id;
  const [form, setForm] = useState(() => {
    const base = { status: 'lead', source: 'manual', tags: [] , ...contact };
    return Object.fromEntries(FIELDS.map((f) => [f, f === 'tags' ? (base.tags ?? []).join(', ') : base[f] ?? '']));
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.email.includes('@')) return toast.error('A valid email is required');
    setSaving(true);
    const row = {
      ...form,
      email: form.email.trim().toLowerCase(),
      estimated_value: form.estimated_value === '' ? null : Number(form.estimated_value),
      next_follow_up: form.next_follow_up || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    for (const k of ['name', 'phone', 'business_name', 'website']) row[k] = row[k]?.trim() || null;
    const q = editing
      ? supabase.from('contacts').update(row).eq('id', contact.id).select().single()
      : supabase.from('contacts').insert(row).select().single();
    const { data, error } = await q;
    setSaving(false);
    if (error) return toast.error(error.code === '23505' ? 'A contact with that email already exists' : error.message);
    toast.success(editing ? 'Contact updated' : 'Contact added');
    onSaved?.(data);
    onClose();
  };

  return (
    <Modal title={editing ? 'Edit contact' : 'New contact'} onClose={onClose} wide>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} autoFocus /></div>
        <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        <div><label className="label">Business</label><input className="input" value={form.business_name} onChange={set('business_name')} /></div>
        <div><label className="label">Website</label><input className="input" value={form.website} onChange={set('website')} placeholder="example.com" /></div>
        <div><label className="label">Estimated value ($)</label><input className="input" type="number" min="0" step="1" value={form.estimated_value} onChange={set('estimated_value')} /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" value={form.source} onChange={set('source')}>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div><label className="label">Next follow-up</label><input className="input" type="date" value={form.next_follow_up} onChange={set('next_follow_up')} /></div>
        <div><label className="label">Tags (comma separated)</label><input className="input" value={form.tags} onChange={set('tags')} placeholder="church, retainer" /></div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add contact'}</button>
        </div>
      </form>
    </Modal>
  );
}
