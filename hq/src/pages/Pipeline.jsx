import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, LayoutGrid, List, Plus, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';
import { SOURCE, STATUS, STATUSES, date, displayName, dollars, today } from '@/lib/format';
import ContactForm from '@/components/ContactForm';
import LeadFinder from '@/components/LeadFinder';
import LeadJobs from '@/components/LeadJobs';
import { PageHeader, Spinner } from '@/components/ui';

const COLUMNS = ['lead', 'prospect', 'customer', 'lost'].map((v) => STATUS[v]);
const PER_COLUMN = 8;
const PER_PAGE = 50;
const ORDER = { lead: 0, prospect: 1, customer: 2, lost: 3, past: 4 };

const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

function ResearchMark({ status }) {
  if (!status) return null;
  const title = { done: 'AI research ready', pending: 'AI research queued', researching: 'AI is researching', failed: 'AI research failed' }[status];
  return (
    <span title={title} className="shrink-0 inline-flex">
      <Sparkles className={clsx('w-3.5 h-3.5', status === 'done' ? 'text-violet-500' : status === 'failed' ? 'text-red-400' : 'text-violet-300 animate-pulse')} aria-label={title} />
    </span>
  );
}

function FollowUp({ d }) {
  if (!d) return null;
  const due = d <= today();
  return <span className={clsx('text-[11px] whitespace-nowrap', due ? 'text-red-600 font-semibold' : 'text-slate-400')}>{due ? 'Due ' : ''}{date(d).replace(/, \d{4}$/, '')}</span>;
}

export default function Pipeline() {
  const nav = useNavigate();
  const [contacts, setContacts] = useState(null);
  const [research, setResearch] = useState({});
  const [adding, setAdding] = useState(false);
  const [finding, setFinding] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [view, setView] = useState(() => read('hq.pipeline.view', 'board'));
  const [q, setQ] = useState('');
  const [audience, setAudience] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState({ lost: false });
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const [{ data }, { data: r }] = await Promise.all([
      supabase.from('contacts')
        .select('id,name,email,business_name,status,source,estimated_value,next_follow_up,city,audience,created_at')
        .neq('status', 'past').order('created_at', { ascending: false }),
      supabase.from('lead_research').select('contact_id,status,created_at').order('created_at'),
    ]);
    setContacts(data ?? []);
    setResearch(Object.fromEntries((r ?? []).map((x) => [x.contact_id, x.status])));
  }, []);
  useEffect(() => { load(); }, [load]);

  const setViewSaved = (v) => { setView(v); write('hq.pipeline.view', v); };

  const move = async (id, status) => {
    const prev = contacts;
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    const { error } = await supabase.from('contacts').update({ status }).eq('id', id);
    if (error) { setContacts(prev); toast.error(error.message); }
  };

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const needle = q.trim().toLowerCase();
    return contacts.filter((c) =>
      (!audience || c.audience === audience) &&
      (!needle || [c.name, c.business_name, c.email, c.city].some((v) => v?.toLowerCase().includes(needle))));
  }, [contacts, q, audience]);

  if (!contacts) return <Spinner />;

  const counts = Object.fromEntries(COLUMNS.map((col) => {
    const items = filtered.filter((c) => c.status === col.value);
    return [col.value, { n: items.length, value: items.reduce((s, c) => s + (Number(c.estimated_value) || 0), 0) }];
  }));

  const listRows = filtered
    .filter((c) => !statusFilter || c.status === statusFilter)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.next_follow_up ?? '9999').localeCompare(b.next_follow_up ?? '9999'));
  const pages = Math.max(1, Math.ceil(listRows.length / PER_PAGE));
  const pageRows = listRows.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <>
      <PageHeader title="Pipeline" subtitle="Blue = lead · Orange = prospect · Green = customer · Red = lost">
        <button className="btn btn-navy" onClick={() => setFinding(true)}><Sparkles className="w-4 h-4" />Find leads with AI</button>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" />New contact</button>
      </PageHeader>

      <LeadJobs onChange={load} />

      {/* Summary: click a status to filter the list */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {COLUMNS.map((col) => (
          <button
            key={col.value}
            onClick={() => { setStatusFilter(statusFilter === col.value ? '' : col.value); setPage(0); if (view === 'board') setViewSaved('list'); }}
            className={clsx('card text-left px-3 py-2 border-l-4 transition-shadow hover:shadow-md', col.bar.replace('border-t-', 'border-l-'), statusFilter === col.value && 'ring-2 ring-navy-400')}
          >
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><span className={clsx('w-2 h-2 rounded-full', col.dot)} />{col.value === 'lost' ? 'Lost' : `${col.label}s`}</p>
            <p className="text-lg font-bold text-navy-900 leading-tight">{counts[col.value].n}
              {counts[col.value].value > 0 && <span className="text-xs font-normal text-slate-500 ml-1.5">{dollars(counts[col.value].value)}/mo</span>}
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-9 h-9" placeholder="Search name, church, business, city" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <select className="input h-9 w-auto" value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Type">
          <option value="">Churches and businesses</option>
          <option value="church">Churches</option>
          <option value="business">Businesses</option>
        </select>
        {statusFilter && <button className="btn btn-ghost h-9" onClick={() => setStatusFilter('')}>Clear status filter</button>}
        <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {[['board', LayoutGrid, 'Board'], ['list', List, 'List']].map(([v, Icon, label]) => (
            <button key={v} onClick={() => setViewSaved(v)} aria-pressed={view === v} className={clsx('inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-sm font-medium', view === v ? 'bg-navy-600 text-white' : 'text-navy-700 hover:bg-slate-50')}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {view === 'board' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
          {COLUMNS.map((col) => {
            const items = filtered.filter((c) => c.status === col.value)
              .sort((a, b) => (a.next_follow_up ?? '9999').localeCompare(b.next_follow_up ?? '9999'));
            const collapsed = col.value === 'lost' && !expanded.lost;
            const showAll = expanded[col.value] === 'all';
            const shown = collapsed ? [] : showAll ? items : items.slice(0, PER_COLUMN);
            return (
              <div
                key={col.value}
                className={clsx('rounded-xl bg-white border border-slate-200 border-t-4 overflow-hidden', col.bar)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragId) move(dragId, col.value); setDragId(null); }}
              >
                <button
                  className={clsx('w-full flex items-center justify-between px-3 py-2 text-sm font-semibold', col.head)}
                  onClick={() => col.value === 'lost' && setExpanded((e) => ({ ...e, lost: !e.lost }))}
                >
                  <span className="flex items-center gap-1.5">
                    {col.value === 'lost' && (collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    {col.label} <span className="font-normal opacity-70">{items.length}</span>
                  </span>
                  {counts[col.value].value > 0 && <span className="text-xs font-normal opacity-80">{dollars(counts[col.value].value)}/mo</span>}
                </button>
                {!collapsed && (
                  <ul className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                    {shown.length === 0 && <li className="px-3 py-4 text-xs text-slate-400 text-center">Drop a contact here</li>}
                    {shown.map((c) => (
                      <li
                        key={c.id}
                        draggable
                        onDragStart={() => setDragId(c.id)}
                        className="group flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-grab active:cursor-grabbing"
                      >
                        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', col.dot)} />
                        <Link to={`/contacts/${c.id}`} className="flex-1 min-w-0">
                          <span className="block text-sm text-navy-900 truncate group-hover:text-orange-600">{c.business_name || displayName(c)}</span>
                          {(c.business_name && c.name) || c.city ? (
                            <span className="block text-[11px] text-slate-400 truncate">{[c.business_name && c.name, c.city].filter(Boolean).join(' · ')}</span>
                          ) : null}
                        </Link>
                        <ResearchMark status={research[c.id]} />
                        <FollowUp d={c.next_follow_up} />
                        <select
                          className="w-5 opacity-40 group-hover:opacity-100 text-xs bg-transparent cursor-pointer"
                          value={c.status}
                          onChange={(e) => move(c.id, e.target.value)}
                          aria-label={`Move ${displayName(c)}`}
                          title="Move to…"
                        >
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
                {!collapsed && items.length > PER_COLUMN && (
                  <button className="w-full text-xs font-medium text-navy-600 py-2 border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => setExpanded((e) => ({ ...e, [col.value]: showAll ? false : 'all' }))}>
                    {showAll ? 'Show less' : `Show all ${items.length}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left font-medium px-3 py-2 w-28">Status</th>
                  <th className="text-left font-medium px-3 py-2">Name</th>
                  <th className="text-left font-medium px-3 py-2">City</th>
                  <th className="text-left font-medium px-3 py-2">Source</th>
                  <th className="text-right font-medium px-3 py-2">Value</th>
                  <th className="text-right font-medium px-3 py-2">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((c) => {
                  const s = STATUS[c.status];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/contacts/${c.id}`)}>
                      <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={(e) => move(c.id, e.target.value)}
                          className={clsx('rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset border-0 cursor-pointer', s?.tone)}
                          aria-label="Status"
                        >
                          {STATUSES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-navy-900 truncate">{c.business_name || displayName(c)}</span>
                          <ResearchMark status={research[c.id]} />
                        </span>
                        {c.business_name && c.name && <span className="block text-xs text-slate-400 truncate">{c.name}</span>}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{c.city}</td>
                      <td className="px-3 py-1.5 text-slate-500">{SOURCE[c.source]?.label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{c.estimated_value ? `${dollars(c.estimated_value)}/mo` : ''}</td>
                      <td className="px-3 py-1.5 text-right"><FollowUp d={c.next_follow_up} /></td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No contacts match.</td></tr>}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 text-sm">
              <span className="text-slate-500">{page * PER_PAGE + 1}–{Math.min(listRows.length, (page + 1) * PER_PAGE)} of {listRows.length}</span>
              <div className="flex gap-1">
                <button className="btn btn-outline h-8" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                <button className="btn btn-outline h-8" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {adding && <ContactForm onClose={() => setAdding(false)} onSaved={load} />}
      {finding && <LeadFinder onClose={() => setFinding(false)} onStarted={load} />}
    </>
  );
}
