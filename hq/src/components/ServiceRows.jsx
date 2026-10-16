import { ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react';
import { date, dollars } from '@/lib/format';
import { CATEGORY, SERVICE_STATUS, renewalInfo } from '@/lib/services';
import { Badge } from './ui';

const money2 = (n) => (n == null ? null : Number(n) % 1 ? `$${Number(n).toFixed(2)}` : dollars(n));
const per = (c) => (c === 'monthly' ? '/mo' : c === 'yearly' ? '/yr' : '');

export default function ServiceRows({ services, onEdit }) {
  return (
    <ul className="divide-y divide-slate-100">
      {services.map((s) => {
        const cat = CATEGORY[s.category] ?? CATEGORY.other;
        const Icon = cat.icon;
        const r = renewalInfo(s);
        return (
          <li key={s.id}>
            <div role="button" tabIndex={0} onClick={() => onEdit(s)} onKeyDown={(e) => e.key === 'Enter' && onEdit(s)} className={`cursor-pointer w-full text-left px-5 py-3 hover:bg-slate-50 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-1 items-center ${s.status === 'cancelled' ? 'opacity-50' : ''}`}>
              <span className="w-8 h-8 rounded-lg bg-navy-50 text-navy-600 grid place-items-center row-span-2 sm:row-span-1"><Icon className="w-4 h-4" /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-navy-900 truncate">{s.name}</span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-orange-600 shrink-0" aria-label="Open link"><ExternalLink className="w-3.5 h-3.5" /></a>
                  )}
                </span>
                <span className="block text-xs text-slate-500 truncate">
                  {cat.label}{s.provider ? ` · ${s.provider}` : ''}{s.account_owner === 'client' ? " · client's account" : ''}
                </span>
              </span>
              <span className="col-start-2 sm:col-start-auto flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                <Badge tone={SERVICE_STATUS[s.status]?.tone}>{SERVICE_STATUS[s.status]?.label}</Badge>
                {r && (
                  <span className={`inline-flex items-center gap-1 ${r.tone}`} title={r.needsAction ? 'Needs to be renewed, paid or transferred by hand' : 'Renews automatically'}>
                    {r.needsAction ? <TriangleAlert className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {r.label ?? date(s.renews_on)}
                  </span>
                )}
              </span>
              <span className="col-start-2 sm:col-start-auto text-xs text-slate-500 sm:text-right sm:w-28 tabular-nums">
                {s.client_price != null && <span className="block text-emerald-700 font-medium">{money2(s.client_price)}{per(s.billing_cycle)} billed</span>}
                {s.our_cost != null && Number(s.our_cost) > 0 && <span className="block">{money2(s.our_cost)}{per(s.billing_cycle)} cost</span>}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
