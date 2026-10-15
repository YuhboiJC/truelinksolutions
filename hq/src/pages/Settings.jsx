import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { stripeAction, supabase } from '@/lib/supabase';
import { PageHeader, Spinner } from '@/components/ui';

function Check({ ok, title, children }) {
  return (
    <div className="flex gap-3 py-3">
      {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <CircleAlert className="w-5 h-5 text-amber-500 shrink-0" />}
      <div className="text-sm">
        <p className="font-medium text-navy-900">{title}</p>
        <div className="text-slate-500">{children}</div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadStatus = () => stripeAction('status').then(setStatus).catch((e) => setStatus({ error: e.message }));
  useEffect(() => {
    supabase.from('business_profile').select('*').single().then(({ data }) => setProfile(data));
    loadStatus();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { mailing_address, calendly_url, notify_email } = profile;
    const { error } = await supabase.from('business_profile').update({ mailing_address, calendly_url, notify_email }).eq('id', true);
    setSaving(false);
    error ? toast.error(error.message) : toast.success('Settings saved');
  };

  const connectWebhook = async () => {
    setConnecting(true);
    try {
      await stripeAction('setup_webhook');
      toast.success('Stripe will now keep invoice statuses in sync');
      loadStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConnecting(false);
    }
  };

  if (!profile) return <Spinner />;
  const set = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold mb-1">Connections</h2>
          {!status ? <Spinner /> : status.error ? <p className="text-sm text-rose-600">{status.error}</p> : (
            <div className="divide-y divide-slate-100">
              <Check ok={status.email} title="Automated emails (Resend)">
                {status.email ? 'Welcome series and audit confirmations are sending.' : 'Add RESEND_API_KEY in Supabase → Edge Functions → Secrets.'}
              </Check>
              <Check ok={status.connected} title={`Stripe${status.mode ? ` (${status.mode} mode)` : ''}`}>
                {status.connected ? 'Invoices are created and emailed through your Stripe account.' : 'Add STRIPE_SECRET_KEY in Supabase → Edge Functions → Secrets.'}
              </Check>
              <Check ok={status.webhook} title="Stripe payment sync">
                {status.webhook ? 'Paid, voided and overdue invoices update here automatically.' : (
                  <>
                    <p>Lets Stripe tell HQ when an invoice gets paid.</p>
                    <button className="btn btn-navy mt-2" onClick={connectWebhook} disabled={!status.connected || connecting}>{connecting ? 'Connecting…' : 'Turn on payment sync'}</button>
                  </>
                )}
              </Check>
              {status.webhook && (
                <div className="pt-3"><button className="btn btn-outline" onClick={connectWebhook} disabled={connecting}>Reconnect payment sync</button></div>
              )}
            </div>
          )}
        </section>

        <form className="card p-5 space-y-4" onSubmit={save}>
          <h2 className="font-semibold">Business details used in emails</h2>
          <div>
            <label className="label">Mailing address (required by law in marketing emails; a P.O. box is fine)</label>
            <input className="input" value={profile.mailing_address ?? ''} onChange={set('mailing_address')} placeholder="PO Box 123, Port Charlotte, FL 33948" />
          </div>
          <div>
            <label className="label">Booking link</label>
            <input className="input" value={profile.calendly_url} onChange={set('calendly_url')} />
          </div>
          <div>
            <label className="label">Send new-lead alerts to</label>
            <input className="input" type="email" value={profile.notify_email} onChange={set('notify_email')} />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </div>
    </>
  );
}
