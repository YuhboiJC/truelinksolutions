import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Mail, MailX, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, stripeAction } from '@/lib/supabase';
import { SOURCE, STATUSES, date, dateTime, displayName, dollars, money } from '@/lib/format';
import ContactForm from '@/components/ContactForm';
import InvoiceForm from '@/components/InvoiceForm';
import ServiceForm from '@/components/ServiceForm';
import ServiceRows from '@/components/ServiceRows';
import { CATEGORY, perMonth } from '@/lib/services';
import { Empty, InvoiceBadge, Spinner, StatusBadge } from '@/components/ui';

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
];
const DOT = { note: 'bg-slate-400', call: 'bg-sky-500', meeting: 'bg-violet-500', email: 'bg-navy-400', form: 'bg-orange-500', status_change: 'bg-amber-500', invoice: 'bg-emerald-500', system: 'bg-slate-300' };

export default function ContactDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [activities, setActivities] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceEdit, setServiceEdit] = useState(null);
  const [editing, setEditing] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('note');

  const load = useCallback(async () => {
    const [{ data: contact }, { data: acts }, { data: invs }, { data: svcs }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).maybeSingle(),
      supabase.from('activities').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('contact_id', id).order('category').order('name'),
    ]);
    setServices(svcs ?? []);
    setC(contact ?? false);
    setActivities(acts ?? []);
    setInvoices(invs ?? []);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const patch = async (fields, msg) => {
    const { error } = await supabase.from('contacts').update(fields).eq('id', id);
    if (error) return toast.error(error.message);
    if (msg) toast.success(msg);
    load();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    const { error } = await supabase.from('activities').insert({ contact_id: id, type: noteType, body: note.trim() });
    if (error) return toast.error(error.message);
    setNote('');
    load();
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${displayName(c)} and their history? Invoices in Stripe are not affected.`)) return;
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Contact deleted');
    nav('/contacts');
  };

  const invoiceAction = async (action, inv, label) => {
    try {
      await stripeAction(action, { invoice_id: inv.id });
      toast.success(label);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (c === null) return <Spinner />;
  if (c === false) return <Empty title="Contact not found"><Link className="underline" to="/contacts">Back to contacts</Link></Empty>;

  const billed = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount_paid, 0);
  const nurtureLabel = !c.subscribed
    ? c.unsubscribed_at ? `Unsubscribed ${date(c.unsubscribed_at)}` : 'Not on email list'
    : c.nurture_step >= 1 ? 'Welcome email sent' : 'On email list';
  const liveServices = services.filter((s) => s.status !== 'cancelled');
  const managedMonthly = liveServices.reduce((t, s) => t + perMonth(s.client_price, s.billing_cycle), 0);
  const managedTypes = [...new Set(liveServices.map((s) => CATEGORY[s.category]?.label ?? 'Other'))];

  return (
    <>
      <Link to="/contacts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-700 mb-4"><ArrowLeft className="w-4 h-4" />Contacts</Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{displayName(c)}</h1>
            <StatusBadge status={c.status} />
          </div>
          {c.business_name && c.name && <p className="text-slate-600">{c.business_name}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
            {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-orange-600"><Mail className="w-4 h-4" />{c.email}</a>}
            {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-orange-600"><Phone className="w-4 h-4" />{c.phone}</a>}
            {c.website && <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-orange-600"><ExternalLink className="w-4 h-4" />{c.website}</a>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <select className="input w-auto" value={c.status} onChange={(e) => patch({ status: e.target.value }, 'Status updated')} aria-label="Status">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className="btn btn-outline" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" />Edit</button>
          <button className="btn btn-primary" onClick={() => setInvoicing(true)}><FileText className="w-4 h-4" />New invoice</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <section className="card p-5 space-y-3 text-sm">
            <h2 className="font-semibold">Details</h2>
            <Row label="Source">{SOURCE[c.source]?.label}</Row>
            <Row label="Added">{date(c.created_at)}</Row>
            {c.estimated_value != null && <Row label="Est. value">{dollars(c.estimated_value)}</Row>}
            <Row label="Paid to date">{money(billed)}</Row>
            {c.tags?.length > 0 && (
              <Row label="Tags"><div className="flex flex-wrap gap-1 justify-end">{c.tags.map((t) => <span key={t} className="rounded bg-navy-50 text-navy-600 px-1.5 py-0.5 text-xs">{t}</span>)}</div></Row>
            )}
            <div className="pt-2 border-t border-slate-100">
              <label className="label">Next follow-up</label>
              <div className="flex gap-2">
                <input type="date" className="input" value={c.next_follow_up ?? ''} onChange={(e) => patch({ next_follow_up: e.target.value || null })} />
                {c.next_follow_up && <button className="btn btn-outline" onClick={() => patch({ next_follow_up: null }, 'Follow-up cleared')}>Done</button>}
              </div>
            </div>
          </section>

          <section className="card p-5 text-sm">
            <h2 className="font-semibold mb-2">Email nurture</h2>
            <p className="text-slate-600">{nurtureLabel}</p>
            {c.subscribed ? (
              <button className="btn btn-outline mt-3" onClick={() => patch({ subscribed: false, unsubscribed_at: new Date().toISOString() }, 'Removed from email list')}>
                <MailX className="w-4 h-4" />Remove from email list
              </button>
            ) : (
              !c.unsubscribed_at && (
                <button className="btn btn-outline mt-3" onClick={() => patch({ subscribed: true, nurture_step: c.nurture_step || 0 }, 'Added to email list')}>
                  <Mail className="w-4 h-4" />Add to email list
                </button>
              )
            )}
            {c.subscribed && c.nurture_step === 0 && <p className="text-xs text-slate-400 mt-2">Manually added contacts don't get the welcome series automatically.</p>}
          </section>

          <button className="btn btn-danger w-full" onClick={remove}><Trash2 className="w-4 h-4" />Delete contact</button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div>
                <h2 className="text-sm font-semibold">What we manage</h2>
                {liveServices.length > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">{managedTypes.join(' · ')}{managedMonthly > 0 ? ` · ${dollars(managedMonthly)}/mo billed` : ''}</p>
                )}
              </div>
              <button className="btn btn-ghost px-2" onClick={() => setServiceEdit({})}><Plus className="w-4 h-4" />Add</button>
            </div>
            {services.length === 0 ? (
              <Empty title="Nothing tracked yet">Add their website, domain, hosting, AI agents or newsletter to see renewals and costs in one place.</Empty>
            ) : <ServiceRows services={services} onEdit={setServiceEdit} />}
          </section>

          <section className="card">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-sm font-semibold">Invoices</h2>
              <button className="btn btn-ghost px-2" onClick={() => setInvoicing(true)}><Plus className="w-4 h-4" />New</button>
            </div>
            {invoices.length === 0 ? (
              <Empty title="No invoices yet">Create one and Stripe emails it with a secure pay link.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <li key={inv.id} className="px-5 py-3 flex flex-wrap items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{inv.number ?? 'Draft'} · {money(inv.amount_due, inv.currency)}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {inv.line_items?.map((l) => l.description).join(', ')}
                        {inv.due_date && inv.status === 'open' ? ` · due ${date(inv.due_date)}` : ''}
                        {inv.paid_at ? ` · paid ${date(inv.paid_at)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <InvoiceBadge status={inv.status} />
                      {inv.hosted_invoice_url && <a className="btn btn-ghost px-2" href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">View</a>}
                      {inv.status === 'open' && (
                        <>
                          <button className="btn btn-ghost px-2" onClick={() => invoiceAction('send_invoice', inv, 'Invoice re-sent')}>Resend</button>
                          <button className="btn btn-ghost px-2" onClick={() => window.confirm('Mark as paid outside Stripe (cash, check, Zelle)?') && invoiceAction('mark_paid', inv, 'Marked paid')}>Mark paid</button>
                          <button className="btn btn-ghost px-2 text-red-600" onClick={() => window.confirm('Void this invoice?') && invoiceAction('void_invoice', inv, 'Invoice voided')}>Void</button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="px-5 pt-4 pb-3 text-sm font-semibold">Activity</h2>
            <form onSubmit={addNote} className="px-5 pb-4 space-y-2">
              <textarea className="textarea" rows={2} placeholder="Log a note, call or meeting…" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex justify-between gap-2">
                <select className="input w-32" value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                  {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button className="btn btn-navy" disabled={!note.trim()}>Add</button>
              </div>
            </form>
            {activities.length === 0 ? (
              <Empty title="No activity yet" />
            ) : (
              <ol className="px-5 pb-5 space-y-4">
                {activities.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT[a.type] ?? 'bg-slate-300'}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-navy-900 whitespace-pre-line break-words">{a.body}</p>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{a.type.replace('_', ' ')} · {dateTime(a.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      {editing && <ContactForm contact={c} onClose={() => setEditing(false)} onSaved={load} />}
      {serviceEdit && <ServiceForm service={serviceEdit.id ? serviceEdit : null} contactId={id} onClose={() => setServiceEdit(null)} onSaved={load} />}
      {invoicing && <InvoiceForm contact={c} onClose={() => setInvoicing(false)} onCreated={load} />}
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-navy-900 text-right">{children}</span>
    </div>
  );
}
