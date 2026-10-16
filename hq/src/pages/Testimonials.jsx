import { useCallback, useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, Pencil, Plus, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { displayName } from '@/lib/format';
import { Badge, Empty, Modal, PageHeader, Spinner } from '@/components/ui';

const REQUEST = `Hi! Would you be willing to share a few sentences about working with TrueLink Solutions? It would mean a lot and helps other churches and businesses decide if we're a good fit.

A few questions to get you started (answer any you like):
- What was it like before we started?
- What's different now?
- Would you recommend TrueLink, and to who?

Please include the name and title you'd like shown (for example "Pastor Jane Doe, Lead Pastor"). Thank you!`;

export default function Testimonials() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('testimonials').select('*, contact:contacts(id,name,business_name,email)').order('sort_order').order('created_at');
    setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    const { error } = await supabase.from('testimonials').update({ published: !t.published }).eq('id', t.id);
    if (error) return toast.error(error.message);
    toast.success(t.published ? 'Hidden from the website' : 'Live on the website (may take up to 5 minutes)');
    load();
  };

  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(REQUEST);
      toast.success('Review request copied. Paste it into a text or email.');
    } catch {
      toast.error("Couldn't copy. Select the text in the box instead.");
    }
  };

  if (!rows) return <Spinner />;

  return (
    <>
      <PageHeader title="Testimonials" subtitle="Published testimonials show on truelinksolutions.com automatically. No website re-upload needed.">
        <button className="btn btn-outline" onClick={copyRequest}><Copy className="w-4 h-4" />Copy review request</button>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Plus className="w-4 h-4" />Add testimonial</button>
      </PageHeader>

      <p className="text-sm text-slate-500 mb-4 max-w-2xl">Only publish a client's own words, with their permission to use their name. If you trim a quote for length, keep the meaning the same.</p>

      {rows.length === 0 ? (
        <div className="card"><Empty icon={Quote} title="No testimonials yet">Ask a happy client for a few sentences, then add their words here.</Empty></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((t) => (
            <div key={t.id} className="card p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge tone={t.published ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}>{t.published ? 'On website' : 'Draft'}</Badge>
                <div className="flex gap-1">
                  <button className="btn btn-ghost px-2" onClick={() => toggle(t)}>{t.published ? <><EyeOff className="w-4 h-4" />Hide</> : <><Eye className="w-4 h-4" />Publish</>}</button>
                  <button className="btn btn-ghost px-2" onClick={() => setEditing(t)} aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-navy-900 leading-relaxed flex-1">“{t.quote}”</p>
              <p className="mt-3 text-sm font-semibold">{t.author_name}</p>
              <p className="text-xs text-slate-500">{[t.author_role, t.organization].filter(Boolean).join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      {editing && <TestimonialForm t={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={load} />}
    </>
  );
}

function TestimonialForm({ t, onClose, onSaved }) {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ quote: '', author_name: '', author_role: '', organization: '', contact_id: '', sort_order: 0, published: false, ...t });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  useEffect(() => {
    supabase.from('contacts').select('id,name,business_name,email').eq('status', 'customer').then(({ data }) => setContacts(data ?? []));
  }, []);

  const pickContact = (e) => {
    const c = contacts.find((x) => x.id === e.target.value);
    setForm((f) => ({ ...f, contact_id: e.target.value, organization: f.organization || c?.business_name || '' }));
  };

  const save = async (e) => {
    e.preventDefault();
    const row = {
      quote: form.quote.trim(), author_name: form.author_name.trim(), author_role: form.author_role?.trim() || null,
      organization: form.organization?.trim() || null, contact_id: form.contact_id || null,
      sort_order: Number(form.sort_order) || 0, published: !!form.published,
    };
    if (!row.quote || !row.author_name) return toast.error('Quote and name are required');
    const { error } = t ? await supabase.from('testimonials').update(row).eq('id', t.id) : await supabase.from('testimonials').insert(row);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!window.confirm('Delete this testimonial?')) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', t.id);
    if (error) return toast.error(error.message);
    onSaved();
    onClose();
  };

  return (
    <Modal title={t ? 'Edit testimonial' : 'Add testimonial'} onClose={onClose} wide>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Their words *</label><textarea className="textarea" rows={5} value={form.quote} onChange={set('quote')} autoFocus /></div>
        <div><label className="label">Name shown *</label><input className="input" value={form.author_name} onChange={set('author_name')} placeholder="Pastor Jane Doe" /></div>
        <div><label className="label">Title / role</label><input className="input" value={form.author_role ?? ''} onChange={set('author_role')} placeholder="Lead Pastor" /></div>
        <div>
          <label className="label">Customer</label>
          <select className="input" value={form.contact_id ?? ''} onChange={pickContact}>
            <option value="">None</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{displayName(c)}</option>)}
          </select>
        </div>
        <div><label className="label">Organization shown</label><input className="input" value={form.organization ?? ''} onChange={set('organization')} /></div>
        <div><label className="label">Order (lower shows first)</label><input className="input" type="number" value={form.sort_order} onChange={set('sort_order')} /></div>
        <label className="flex items-center gap-2 text-sm text-slate-600 self-end pb-2">
          <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.published} onChange={set('published')} />
          Show on website (they've approved it)
        </label>
        <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
          {t ? <button type="button" className="btn btn-danger" onClick={remove}>Delete</button> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary">Save</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
