import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

/** Progress for recent AI lead-finder runs. Polls while anything is running. */
export default function LeadJobs({ onChange }) {
  const [jobs, setJobs] = useState([]);
  const [dismissed, setDismissed] = useState(() => read('hq.leadjobs.dismissed'));
  const last = useRef('');

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 3 * 86400000).toISOString();
    const { data } = await supabase.from('lead_jobs').select('*, research:lead_research(status)')
      .gte('created_at', since).order('created_at', { ascending: false }).limit(5);
    const list = data ?? [];
    setJobs(list);
    const sig = JSON.stringify(list.map((j) => [j.id, j.status, j.research?.map((r) => r.status)]));
    if (last.current && sig !== last.current) onChange?.();
    last.current = sig;
    return list;
  }, [onChange]);

  useEffect(() => {
    let timer;
    const loop = async () => {
      const list = await load();
      const active = list.some((j) => ['queued', 'finding', 'researching'].includes(j.status));
      timer = setTimeout(loop, active ? 5000 : 30000);
    };
    loop();
    return () => clearTimeout(timer);
  }, [load]);

  const visible = jobs.filter((j) => !dismissed.includes(j.id));
  if (!visible.length) return null;

  const dismiss = (id) => { const d = [...dismissed, id].slice(-50); setDismissed(d); write('hq.leadjobs.dismissed', d); };

  return (
    <div className="space-y-2 mb-4">
      {visible.map((j) => {
        const done = j.research?.filter((r) => r.status === 'done').length ?? 0;
        const failed = j.research?.filter((r) => r.status === 'failed').length ?? 0;
        const total = j.found || j.research?.length || 0;
        const kind = j.audience === 'church' ? 'churches' : 'businesses';
        const running = ['queued', 'finding', 'researching'].includes(j.status);
        const text = j.status === 'failed' ? `Lead search failed: ${j.error}`
          : j.status === 'queued' || j.status === 'finding' ? `Searching for ${j.requested} ${kind}${j.niche ? ` (${j.niche})` : ''}…`
          : j.status === 'researching' ? `Found ${total} ${kind}. Researching each one: ${done} of ${total} ready`
          : total ? `Done: ${done} ${kind} researched${failed ? `, ${failed} couldn't be researched` : ''}. Look for the ✦ next to their names.`
          : j.error || 'No new leads found.';
        return (
          <div key={j.id} className={`card flex items-center gap-3 px-4 py-2.5 text-sm ${j.status === 'failed' ? 'border-red-200 bg-red-50/50' : running ? 'border-violet-200 bg-violet-50/50' : ''}`}>
            {running ? <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
              : j.status === 'failed' ? <CircleAlert className="w-4 h-4 text-red-500 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-navy-900">{text}</p>
              {j.status === 'researching' && total > 0 && (
                <div className="h-1.5 rounded-full bg-violet-100 mt-1.5 overflow-hidden">
                  <div className="h-full bg-violet-500 transition-all" style={{ width: `${Math.round(((done + failed) / total) * 100)}%` }} />
                </div>
              )}
            </div>
            {!running && <button className="text-slate-400 hover:text-slate-600" onClick={() => dismiss(j.id)} aria-label="Dismiss"><X className="w-4 h-4" /></button>}
          </div>
        );
      })}
    </div>
  );
}
