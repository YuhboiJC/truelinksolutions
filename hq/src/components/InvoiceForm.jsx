import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { stripeAction } from '@/lib/supabase';
import { displayName, money } from '@/lib/format';
import { Modal } from './ui';

const blank = () => ({ description: '', quantity: 1, unit_price: '' });

export default function InvoiceForm({ contact, onClose, onCreated }) {
  const [items, setItems] = useState([blank()]);
  const [memo, setMemo] = useState('');
  const [days, setDays] = useState(14);
  const [send, setSend] = useState(true);
  const [saving, setSaving] = useState(false);

  const update = (i, k) => (e) => setItems((arr) => arr.map((it, j) => (j === i ? { ...it, [k]: e.target.value } : it)));
  const total = items.reduce((sum, it) => sum + Math.round((Number(it.unit_price) || 0) * 100) * (Number(it.quantity) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { invoice } = await stripeAction('create_invoice', {
        contact_id: contact.id,
        items,
        memo,
        days_until_due: Number(days),
        send,
      });
      toast.success(send ? `Invoice sent to ${contact.email}` : 'Invoice created');
      onCreated?.(invoice);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`New invoice for ${displayName(contact)}`} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_70px_110px_32px] gap-2 text-xs font-medium text-slate-500">
            <span>Description</span><span>Qty</span><span>Unit price</span><span />
          </div>
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_32px] sm:grid-cols-[1fr_70px_110px_32px] gap-2">
              <input className="input col-span-1" placeholder="e.g. Website build, monthly AI agent management" value={it.description} onChange={update(i, 'description')} required />
              <button type="button" className="sm:hidden btn btn-ghost px-0" onClick={() => setItems((a) => a.filter((_, j) => j !== i))} disabled={items.length === 1} aria-label="Remove line"><Trash2 className="w-4 h-4" /></button>
              <input className="input" type="number" min="1" step="1" value={it.quantity} onChange={update(i, 'quantity')} aria-label="Quantity" />
              <input className="input" type="number" min="0" step="0.01" placeholder="$0.00" value={it.unit_price} onChange={update(i, 'unit_price')} aria-label="Unit price" required />
              <button type="button" className="hidden sm:inline-flex btn btn-ghost px-0" onClick={() => setItems((a) => a.filter((_, j) => j !== i))} disabled={items.length === 1} aria-label="Remove line"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost px-2" onClick={() => setItems((a) => [...a, blank()])}><Plus className="w-4 h-4" /> Add line</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Memo (shown on invoice)</label><input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Thank you for your business!" /></div>
          <div><label className="label">Due in (days)</label><input className="input" type="number" min="0" max="90" value={days} onChange={(e) => setDays(e.target.value)} /></div>
        </div>

        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} className="accent-orange-500 w-4 h-4" />
          Email the invoice to {contact.email} now (Stripe sends it with a secure pay link)
        </label>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">Total <span className="text-lg font-semibold text-navy-900 ml-1">{money(total)}</span></p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving || total <= 0}>{saving ? 'Creating…' : send ? 'Create & send' : 'Create invoice'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
