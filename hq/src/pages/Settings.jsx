import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { leadAgentAction, opsAction, stripeAction, supabase } from '@/lib/supabase';
import { dateTime } from '@/lib/format';
import { PageHeader, Spinner } from '@/components/ui';
import PlansCard from '@/components/PlansCard';
import ToolsCard from '@/components/ToolsCard';
import TeamCard from '@/components/TeamCard';

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
  const [stripeKey, setStripeKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [changingKey, setChangingKey] = useState(false);

  const saveKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      await stripeAction('save_key', { key: stripeKey });
      setStripeKey('');
      setChangingKey(false);
      toast.success('Stripe connected. Now turn on payment sync.');
      loadStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingKey(false);
    }
  };

  const [ops, setOps] = useState(null);
  const [hToken, setHToken] = useState('');
  const [savingH, setSavingH] = useState(false);
  const loadOps = () => opsAction('status').then(setOps).catch(() => setOps({}));
  const saveHostinger = async (e) => {
    e.preventDefault();
    setSavingH(true);
    try {
      const r = await opsAction('save_hostinger_token', { token: hToken });
      setHToken('');
      toast.success(`Hostinger connected: ${r.added} added, ${r.updated} updated under Services`);
      loadOps();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingH(false);
    }
  };

  const loadStatus = () => stripeAction('status').then(setStatus).catch((e) => setStatus({ error: e.message }));
  const [ai, setAi] = useState(null);
  const [aiKey, setAiKey] = useState('');
  const [savingAi, setSavingAi] = useState(false);
  const loadAi = () => leadAgentAction('status').then((r) => setAi(r.connected)).catch(() => setAi(false));
  const saveAi = async (e) => {
    e.preventDefault();
    setSavingAi(true);
    try {
      await leadAgentAction('save_key', { key: aiKey });
      setAiKey('');
      toast.success('AI lead finder connected');
      loadAi();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingAi(false);
    }
  };
  useEffect(() => {
    loadOps();
    loadAi();
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
                {status.email ? 'Welcome series and audit confirmations are sending from info@truelinksolutions.com.' : 'Email sending key is missing.'}
              </Check>
              <Check ok={status.connected} title={`Stripe${status.mode ? ` (${status.mode} mode)` : ''}`}>
                {status.connected && !changingKey ? (
                  <>
                    <p>Invoices are created and emailed through your Stripe account.</p>
                    {status.mode === 'test' && <p className="text-amber-600 mt-1">Test mode: invoices are practice only. Switch to your live key when you're ready to bill real clients.</p>}
                    <button className="btn btn-outline mt-2" onClick={() => setChangingKey(true)}>{status.mode === 'test' ? 'Switch to live key' : 'Change key'}</button>
                  </>
                ) : (
                  <form onSubmit={saveKey} className="mt-1 space-y-2">
                    <p>In Stripe, open <strong>Developers → API keys</strong> and copy the <strong>Secret key</strong> (starts with <code>sk_test_</code> or <code>sk_live_</code>). It's stored securely on the server and never shown again.</p>
                    <input className="input font-mono" type="password" autoComplete="off" placeholder="sk_test_…" value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="btn btn-navy" disabled={savingKey || !stripeKey.trim()}>{savingKey ? 'Checking…' : 'Connect Stripe'}</button>
                      {changingKey && <button type="button" className="btn btn-outline" onClick={() => setChangingKey(false)}>Cancel</button>}
                    </div>
                  </form>
                )}
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
                <div className="py-3"><button className="btn btn-outline" onClick={connectWebhook} disabled={connecting}>Reconnect payment sync</button></div>
              )}
              <Check ok={!!ai} title="AI lead finder (Claude)">
                {ai ? <p>Connected. Use &ldquo;Find leads with AI&rdquo; on the Pipeline page.</p> : (
                  <form onSubmit={saveAi} className="mt-1 space-y-2">
                    <p>Create a key at <a className="underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com → API keys</a> and paste it here. Set a monthly spend limit there too.</p>
                    <input className="input font-mono" type="password" autoComplete="off" placeholder="sk-ant-…" value={aiKey} onChange={(e) => setAiKey(e.target.value)} />
                    <button className="btn btn-navy" disabled={savingAi || !aiKey.trim()}>{savingAi ? 'Checking…' : 'Connect'}</button>
                  </form>
                )}
              </Check>
              <Check ok={!!ops?.hostinger} title="Hostinger (hosting + domains)">
                {ops?.hostinger ? (
                  <p>Renewal dates and prices sync into Services every morning{ops.last_sync ? ` (last: ${dateTime(ops.last_sync)})` : ''}.</p>
                ) : (
                  <form onSubmit={saveHostinger} className="mt-1 space-y-2">
                    <p>Keeps your Hostinger plans and domains up to date under Services automatically. In hPanel, open <strong>Dev tools → API → API tokens</strong>, click <strong>New token</strong> (pick the longest expiration), and paste it here. It's stored on the server and never shown again.</p>
                    <input className="input font-mono" type="password" autoComplete="off" placeholder="Hostinger API token" value={hToken} onChange={(e) => setHToken(e.target.value)} />
                    <button className="btn btn-navy" disabled={savingH || !hToken.trim()}>{savingH ? 'Checking…' : 'Connect Hostinger'}</button>
                  </form>
                )}
              </Check>
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

        <TeamCard />
        <ToolsCard />
        <PlansCard status={status} onChanged={loadStatus} />
      </div>
    </>
  );
}
