import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ExternalLink, Inbox, Newspaper, RefreshCw, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { newsletterAction, supabase } from '@/lib/supabase';
import { Badge, Empty, PageHeader, Spinner } from '@/components/ui';
import { date, dateTime } from '@/lib/format';

const TONE = {
  ready: 'bg-amber-50 text-amber-700 ring-amber-200',
  sending: 'bg-sky-50 text-sky-700 ring-sky-200',
  sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  skipped: 'bg-slate-100 text-slate-500 ring-slate-200',
};
const LABEL = { ready: 'Waiting to send', sending: 'Sending', sent: 'Sent', skipped: 'Skipped' };

export default function Newsletter() {
  const [issues, setIssues] = useState(null);
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ list: 0, substack: 0, audience: 0 });
  const [busy, setBusy] = useState('');
  const [replace, setReplace] = useState(true);
  const [stats, setStats] = useState({});

  const load = async () => {
    const [iss, prof, list, sub, aud, sends] = await Promise.all([
      supabase.from('newsletter_issues').select('id,title,subtitle,url,status,published_at,sent_at,recipient_count,last_error').order('published_at', { ascending: false }),
      supabase.from('business_profile').select('substack_url,newsletter_auto_send').single(),
      supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('subscribed', true).is('unsubscribed_at', null),
      supabase.from('substack_subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('newsletter_audience').select('*', { count: 'exact', head: true }),
      supabase.from('newsletter_sends').select('issue_id,opened_at,clicked_at'),
    ]);
    const st = {};
    for (const r of sends.data ?? []) {
      const x = (st[r.issue_id] ??= { sent: 0, opened: 0, clicked: 0 });
      x.sent++; if (r.opened_at) x.opened++; if (r.clicked_at) x.clicked++;
    }
    setStats(st);
    setIssues(iss.data ?? []);
    setProfile(prof.data);
    setCounts({ list: list.count ?? 0, substack: sub.count ?? 0, audience: aud.count ?? 0 });
  };
  useEffect(() => { load(); }, []);

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await fn();
      toast.success(typeof success === 'function' ? success(res) : success);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const toggleAuto = async () => {
    const next = !profile.newsletter_auto_send;
    const { error } = await supabase.from('business_profile').update({ newsletter_auto_send: next }).eq('id', true);
    if (error) return toast.error(error.message);
    setProfile((p) => ({ ...p, newsletter_auto_send: next }));
    toast.success(next ? 'New issues will email automatically' : 'New issues will wait for you to click Send');
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const emails = [...new Set((text.match(/[^\s@,;"'<>]+@[^\s@,;"'<>]+\.[^\s@,;"'<>]+/g) ?? []).map((m) => m.toLowerCase()))];
    if (!emails.length) return toast.error("Couldn't find any email addresses in that file");
    run('import', () => newsletterAction('import_substack', { emails, replace }),
      (r) => `Imported ${r.imported} Substack subscribers (${r.total} total). They won't get a duplicate email.`);
  };

  if (!issues || !profile) return <Spinner />;

  return (
    <>
      <PageHeader title="Newsletter" subtitle="TrueLink AI Weekly: publish on Substack, and your website list gets it by email automatically.">
        <a className="btn btn-outline" href={`${profile.substack_url}/publish/home`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />Open Substack</a>
        <button className="btn btn-navy" disabled={busy === 'check'} onClick={() => run('check', () => newsletterAction('check_now'),
          (r) => (r.imported ? `Found ${r.imported} new issue${r.imported === 1 ? '' : 's'}` : 'No new issues on Substack yet'))}>
          <RefreshCw className={`w-4 h-4 ${busy === 'check' ? 'animate-spin' : ''}`} />Check Substack now
        </button>
      </PageHeader>

      <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 border-l-4 border-l-navy-500">
        <Inbox className="w-6 h-6 text-navy-500 shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-navy-900">Business inbox: <a className="text-navy-600 underline" href="mailto:info@truelinksolutions.com">info@truelinksolutions.com</a></p>
          <p className="text-slate-600 mt-0.5">
            Use this one address for newsletters (issues go out from it and replies come back to it), service tickets and support
            requests from customers, and all other TrueLink business email. Check it daily.
          </p>
        </div>
        <a className="btn btn-outline shrink-0" href="https://mail.hostinger.com" target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />Open inbox</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">On your website email list</p>
          <p className="text-2xl font-bold mt-1">{counts.list}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Already on Substack (skipped)</p>
          <p className="text-2xl font-bold mt-1">{counts.list - counts.audience}</p>
          <p className="text-xs text-slate-400">{counts.substack} Substack emails on file</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Next issue goes to</p>
          <p className="text-2xl font-bold mt-1">{counts.audience}</p>
          <p className="text-xs text-slate-400">people by email from TrueLink</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card lg:col-span-2">
          <h2 className="px-5 pt-4 pb-3 text-sm font-semibold">Issues</h2>
          {issues.length === 0 ? (
            <Empty icon={Newspaper} title="No issues yet">
              When you publish this week's issue on Substack, it shows up here within 10 minutes and emails out automatically.
            </Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {issues.map((i) => (
                <li key={i.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/newsletter/${i.id}`} className="text-sm font-medium text-navy-900 hover:text-orange-600">{i.title}</Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Published {date(i.published_at)}
                        {i.status === 'sent' && ` · emailed to ${i.recipient_count} ${i.recipient_count === 1 ? 'person' : 'people'} ${dateTime(i.sent_at)}`}
                        {i.status === 'sending' && ` · ${i.recipient_count} sent so far, the rest go out within 10 minutes`}
                      </p>
                      {stats[i.id]?.sent > 0 && (
                        <p className="text-xs text-slate-600 mt-1">
                          Opened by {stats[i.id].opened} of {stats[i.id].sent} · clicked by {stats[i.id].clicked}
                        </p>
                      )}
                      {i.last_error && <p className="text-xs text-rose-600 mt-1">Last attempt: {i.last_error}</p>}
                    </div>
                    <Badge tone={TONE[i.status]}>{LABEL[i.status]}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 -ml-2">
                    <Link className="btn btn-ghost px-2 h-8" to={`/newsletter/${i.id}`}><BarChart3 className="w-3.5 h-3.5" />Who got it</Link>
                    {i.url && <a className="btn btn-ghost px-2 h-8" href={i.url} target="_blank" rel="noreferrer">View on Substack</a>}
                    <button className="btn btn-ghost px-2 h-8" disabled={!!busy} onClick={() => run(`test-${i.id}`, () => newsletterAction('send_test', { issue_id: i.id }), (r) => `Test sent to ${r.to}`)}>
                      Send me a test
                    </button>
                    {i.status === 'sent' && (
                      <button
                        className="btn btn-ghost px-2 h-8"
                        disabled={!!busy}
                        title="Emails this issue to anyone who joined after it went out"
                        onClick={() => run(`send-${i.id}`, () => newsletterAction('send', { issue_id: i.id }),
                          (r) => (r.sent ? `Sent to ${r.sent} new ${r.sent === 1 ? 'subscriber' : 'subscribers'}` : 'Everyone on the list already has this issue'))}
                      >
                        <Send className="w-3.5 h-3.5" />{busy === `send-${i.id}` ? 'Sending…' : 'Send to new subscribers'}
                      </button>
                    )}
                    {(i.status === 'ready' || i.status === 'sending' || i.status === 'skipped') && (
                      <button
                        className="btn btn-ghost px-2 h-8 text-orange-600"
                        disabled={!!busy}
                        onClick={() => window.confirm(`Email "${i.title}" to ${counts.audience} people now?`) &&
                          run(`send-${i.id}`, () => newsletterAction('send', { issue_id: i.id }),
                            (r) => (r.finished ? `Sent to ${r.sent} people` : `Sent ${r.sent}. The rest will go out within 10 minutes.`))}
                      >
                        <Send className="w-3.5 h-3.5" />{busy === `send-${i.id}` ? 'Sending…' : 'Send now'}
                      </button>
                    )}
                    {i.status === 'ready' && (
                      <button className="btn btn-ghost px-2 h-8 text-slate-500" disabled={!!busy} onClick={() => run(`skip-${i.id}`, () => newsletterAction('skip', { issue_id: i.id }), "Skipped. It won't be emailed.")}>
                        Don't email this one
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="font-semibold mb-2">Automatic sending</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-orange-500 w-4 h-4" checked={profile.newsletter_auto_send} onChange={toggleAuto} />
              <span className="text-slate-600">
                Email each new Substack issue to my website list automatically (checked every 10 minutes).
                {!profile.newsletter_auto_send && <span className="block text-amber-600 mt-1">Off: new issues wait here until you click Send now.</span>}
              </span>
            </label>
          </section>

          <section className="card p-5 text-sm">
            <h2 className="font-semibold mb-1">Substack subscribers</h2>
            <p className="text-slate-500 mb-3">
              People who already subscribe on Substack get the issue from Substack, so TrueLink skips them. Keep this list current:
              in Substack go to <strong>Subscribers → Export</strong>, then upload the CSV here. Once a month is plenty.
            </p>
            <label className="flex items-center gap-2 text-slate-600 mb-3">
              <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              Replace the previous list
            </label>
            <label className={`btn btn-outline cursor-pointer ${busy === 'import' ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />{busy === 'import' ? 'Importing…' : 'Upload Substack CSV'}
              <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={importCsv} />
            </label>
          </section>

          <section className="card p-5 text-sm text-slate-600 space-y-2">
            <h2 className="font-semibold text-navy-900">How it works</h2>
            <p>1. Friday's task drafts the issue and saves it to Substack.</p>
            <p>2. You review it and click Publish on Substack. Substack emails your Substack subscribers.</p>
            <p>3. Within 10 minutes, TrueLink emails the same issue to everyone who signed up on your website and isn't on Substack.</p>
            <p>4. Click any issue to see who received it, who opened it and which links they clicked.</p>
            <p>New website signups get a welcome email right away.</p>
          </section>
        </div>
      </div>
    </>
  );
}
