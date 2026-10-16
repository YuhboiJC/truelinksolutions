import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Info, MailCheck, MailOpen, MousePointerClick, Send, TriangleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { date, dateTime, displayName } from '@/lib/format';
import { Badge, Empty, Spinner } from '@/components/ui';

const STATUS = {
  sent: { label: 'Sent', tone: 'bg-slate-100 text-slate-600 ring-slate-200' },
  delivered: { label: 'Delivered', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  opened: { label: 'Opened', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  clicked: { label: 'Clicked', tone: 'bg-orange-50 text-orange-700 ring-orange-200' },
  bounced: { label: 'Bounced', tone: 'bg-rose-50 text-rose-600 ring-rose-200' },
  complained: { label: 'Marked spam', tone: 'bg-rose-50 text-rose-600 ring-rose-200' },
};

const FILTERS = [
  { key: 'all', label: 'Everyone' },
  { key: 'opened', label: 'Opened', test: (r) => !!r.opened_at },
  { key: 'unopened', label: "Didn't open", test: (r) => !r.opened_at && !['bounced', 'complained'].includes(r.status) },
  { key: 'clicked', label: 'Clicked', test: (r) => !!r.clicked_at },
  { key: 'problems', label: 'Bounced or spam', test: (r) => ['bounced', 'complained'].includes(r.status) },
];

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '–');
const shortLink = (u) => {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, '');
  } catch {
    return u;
  }
};

export default function NewsletterIssue() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const [{ data: iss }, { data: sends }] = await Promise.all([
        supabase.from('newsletter_issues').select('id,title,subtitle,url,status,published_at,sent_at,recipient_count').eq('id', id).maybeSingle(),
        supabase.from('newsletter_sends').select('*, contact:contacts(id,name,email,business_name)').eq('issue_id', id).order('sent_at'),
      ]);
      setIssue(iss ?? false);
      setRows(sends ?? []);
    })();
  }, [id]);

  const s = useMemo(() => {
    const sent = rows.length;
    const delivered = rows.filter((r) => r.delivered_at || r.opened_at).length;
    const opened = rows.filter((r) => r.opened_at).length;
    const clicked = rows.filter((r) => r.clicked_at).length;
    const problems = rows.filter((r) => ['bounced', 'complained'].includes(r.status)).length;
    const links = {};
    rows.forEach((r) => (r.clicked_links ?? []).forEach((l) => { links[l] = (links[l] ?? 0) + 1; }));
    const topLinks = Object.entries(links).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { sent, delivered, opened, clicked, problems, topLinks };
  }, [rows]);

  if (issue === null) return <Spinner />;
  if (issue === false) return <Empty title="Issue not found"><Link className="underline" to="/newsletter">Back to newsletter</Link></Empty>;

  const f = FILTERS.find((x) => x.key === filter);
  const shown = f.test ? rows.filter(f.test) : rows;
  const tracked = rows.some((r) => r.resend_id);

  return (
    <>
      <Link to="/newsletter" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-700 mb-4"><ArrowLeft className="w-4 h-4" />Newsletter</Link>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-navy-900">{issue.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Published {date(issue.published_at)}{issue.sent_at ? ` · emailed ${dateTime(issue.sent_at)}` : ''}
          </p>
        </div>
        {issue.url && <a className="btn btn-outline shrink-0" href={issue.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />View on Substack</a>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Tile icon={Send} label="Emailed" value={s.sent} />
        <Tile icon={MailCheck} label="Delivered" value={s.delivered} hint={pct(s.delivered, s.sent)} />
        <Tile icon={MailOpen} label="Opened" value={s.opened} hint={`${pct(s.opened, s.delivered || s.sent)} of delivered`} />
        <Tile icon={MousePointerClick} label="Clicked a link" value={s.clicked} hint={`${pct(s.clicked, s.opened)} of openers`} />
        <Tile icon={TriangleAlert} label="Bounced or spam" value={s.problems} warn={s.problems > 0} hint={s.problems ? 'Removed from the list' : 'None'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card lg:col-span-2 overflow-hidden">
          <div className="flex flex-wrap gap-1 px-4 pt-4 pb-3 border-b border-slate-100">
            {FILTERS.map((x) => {
              const n = x.test ? rows.filter(x.test).length : rows.length;
              return (
                <button key={x.key} onClick={() => setFilter(x.key)}
                  className={`btn h-8 px-3 ${filter === x.key ? 'bg-navy-600 text-white hover:bg-navy-700' : 'btn-ghost'}`}>
                  {x.label} <span className="opacity-70 tabular-nums">{n}</span>
                </button>
              );
            })}
          </div>
          {shown.length === 0 ? (
            <Empty title={rows.length ? 'Nobody in this group' : 'Not emailed from TrueLink yet'}>
              {rows.length ? 'Try another filter.' : 'Website subscribers show up here once this issue is emailed.'}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-2 font-medium">Subscriber</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">First opened</th>
                    <th className="px-4 py-2 font-medium text-right">Opens</th>
                    <th className="px-4 py-2 font-medium">Clicked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.map((r) => (
                    <tr key={r.contact_id} className="align-top">
                      <td className="px-4 py-3 min-w-0">
                        {r.contact ? (
                          <Link to={`/contacts/${r.contact.id}`} className="font-medium text-navy-900 hover:text-orange-600">{displayName(r.contact)}</Link>
                        ) : <span className="text-slate-500">Removed contact</span>}
                        <p className="text-xs text-slate-500 truncate">{r.contact?.email ?? r.email}</p>
                      </td>
                      <td className="px-4 py-3"><Badge tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label ?? r.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.opened_at ? dateTime(r.opened_at) : '–'}
                        {r.open_count > 1 && r.last_opened_at && <p className="text-xs text-slate-400">last {dateTime(r.last_opened_at)}</p>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{r.open_count || '–'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {(r.clicked_links ?? []).length ? (
                          <ul className="space-y-0.5">
                            {r.clicked_links.map((l) => <li key={l} className="text-xs truncate max-w-[170px]" title={l}>{shortLink(l)}</li>)}
                          </ul>
                        ) : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="font-semibold mb-3">Most clicked links</h2>
            {s.topLinks.length === 0 ? <p className="text-slate-500">No clicks yet.</p> : (
              <ul className="space-y-2">
                {s.topLinks.map(([l, n]) => (
                  <li key={l} className="flex items-center justify-between gap-3">
                    <a href={l} target="_blank" rel="noreferrer" className="truncate text-navy-600 hover:text-orange-600" title={l}>{shortLink(l)}</a>
                    <span className="tabular-nums text-slate-500 shrink-0">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5 text-sm text-slate-600 space-y-2">
            <h2 className="font-semibold text-navy-900 flex items-center gap-2"><Info className="w-4 h-4 text-orange-500" />Reading these numbers</h2>
            {!tracked && rows.length > 0 && <p className="text-amber-700">This issue went out before tracking was turned on, so only "Emailed" is available for it.</p>}
            <p><strong>Opens</strong> count when the email's images load. Apple Mail loads them automatically for privacy, so some opens are the phone, not the person. Clicks are the most reliable sign someone read it.</p>
            <p>Email can't measure <strong>time spent reading</strong>. Opening it more than once (the Opens column) and clicking are the best stand-ins.</p>
            <p>This page covers people TrueLink emails. Readers who subscribe on Substack have their own stats in your Substack dashboard.</p>
          </section>
        </div>
      </div>
    </>
  );
}

function Tile({ icon: Icon, label, value, hint, warn }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className={`w-4 h-4 ${warn ? 'text-rose-500' : 'text-orange-500'}`} />{label}</div>
      <p className={`text-2xl font-bold mt-2 tabular-nums ${warn ? 'text-rose-600' : 'text-navy-900'}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
