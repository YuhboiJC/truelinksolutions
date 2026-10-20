import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Church, Info, Minus, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ANNUAL_MONTHS, CHECKOUT_LINKS, COMPARE, EVERY_PLAN, PLANS } from './data';
import FeatureModal from './FeatureModal';
import { getPlanLinks } from '@/lib/api';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.55 } };

function goToAudit() {
  document.querySelector('#book-call')?.scrollIntoView({ behavior: 'smooth' });
}

function PlanCard({ plan, annual, onOpen, liveLinks }) {
  const pop = plan.popular;
  const yearly = plan.monthly * ANNUAL_MONTHS;
  const shown = annual ? yearly / 12 : plan.monthly;
  const period = annual ? 'annual' : 'monthly';
  const link = liveLinks?.[plan.id]?.[period] || CHECKOUT_LINKS[plan.id]?.[period];

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-3xl p-8 transition-shadow',
        pop
          ? 'bg-navy-700 text-white shadow-2xl ring-4 ring-orange-400/70 lg:scale-[1.05] lg:z-10'
          : 'bg-white border border-slate-200 shadow-sm',
      )}
    >
      {pop && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
          Most popular
        </span>
      )}
      <h3 className={cn('text-2xl font-bold', pop ? 'text-white' : 'text-navy-900')}>{plan.name}</h3>
      <p className={cn('mt-1 min-h-12', pop ? 'text-white/80' : 'text-slate-600')}>{plan.promise}</p>

      <div className="mt-6">
        {plan.startsAt && <p className={cn('text-xs font-semibold uppercase tracking-wider mb-1', pop ? 'text-orange-200' : 'text-slate-500')}>Starts at</p>}
        <p className="flex items-baseline gap-2">
          <span className={cn('text-5xl font-bold tracking-tight', pop ? 'text-white' : 'text-navy-900')}>${fmt(shown)}</span>
          <span className={pop ? 'text-white/70' : 'text-slate-500'}>/month</span>
        </p>
        <p className={cn('text-sm mt-1.5 h-5', pop ? 'text-white/70' : 'text-slate-500')}>
          {annual ? (
            <>
              <span className="line-through mr-1.5">${fmt(plan.monthly)}</span>
              Billed ${fmt(yearly)} yearly
            </>
          ) : (
            'Billed monthly · no setup fee'
          )}
        </p>
      </div>

      <Button
        as={link ? 'a' : 'button'}
        href={link || undefined}
        variant={pop ? 'accent' : 'outline'}
        className="mt-7 w-full"
        onClick={link ? undefined : goToAudit}
      >
        {link ? `Get started with ${plan.name}` : 'Start with a free audit'}
      </Button>
      {link && (
        <button onClick={goToAudit} className={cn('mt-2.5 text-sm underline underline-offset-4', pop ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-navy-700')}>
          Not sure yet? Book a free audit first
        </button>
      )}

      <div className={cn('mt-7 pt-6 border-t flex-1', pop ? 'border-white/15' : 'border-slate-100')}>
        {plan.everything && (
          <p className={cn('text-sm font-semibold mb-3', pop ? 'text-orange-200' : 'text-navy-600')}>Everything in {plan.everything}, plus:</p>
        )}
        <ul className="space-y-1">
          {plan.items.map(([id, label]) => (
            <li key={id}>
              <button
                onClick={() => onOpen(id)}
                className={cn(
                  'group w-full flex gap-2.5 rounded-lg px-2 py-1.5 -mx-2 text-left text-sm leading-relaxed transition-colors',
                  pop ? 'text-white/90 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                <Check className={cn('w-5 h-5 shrink-0', pop ? 'text-orange-300' : 'text-orange-500')} />
                <span className={cn('flex-1 underline decoration-dotted underline-offset-4', pop ? 'decoration-white/30' : 'decoration-slate-300')}>{label}</span>
                <Info className={cn('w-4 h-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100', pop ? 'text-white' : 'text-navy-400')} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Cell({ v }) {
  if (v === true) return <Check className="w-5 h-5 text-orange-500 mx-auto" aria-label="Included" />;
  if (v === false) return <Minus className="w-4 h-4 text-slate-300 mx-auto" aria-label="Not included" />;
  return <span>{v}</span>;
}

function Compare({ tab, tiers }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-14">
      <div className="text-center">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-slate-100"
        >
          {open ? 'Hide' : 'Compare'} all features
          <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left font-semibold text-navy-900 p-4 w-[34%]"> </th>
                {tiers.map((t) => (
                  <th key={t.id} className={cn('p-4 font-bold text-navy-900 text-center', t.popular && 'bg-orange-50')}>
                    {t.name}
                    <span className="block font-normal text-slate-500">${fmt(t.monthly)}/mo</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE[tab].map(([label, ...vals]) => (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <td className="p-4 text-slate-700">{label}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={cn('p-4 text-center text-slate-600', tiers[i].popular && 'bg-orange-50/60')}>
                      <Cell v={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Pricing() {
  const [tab, setTab] = useState('church');
  const [annual, setAnnual] = useState(false);
  const [liveLinks, setLiveLinks] = useState({});
  useEffect(() => { getPlanLinks().then((r) => setLiveLinks(r.links)); }, []);
  const [feature, setFeature] = useState(null);
  const tiers = PLANS[tab];
  const close = useCallback(() => setFeature(null), []);

  // Which plans include the open feature (a plan includes everything below it).
  const first = feature ? tiers.findIndex((t) => t.items.some(([id]) => id === feature)) : -1;
  const planNames = first >= 0 ? tiers.slice(first).map((t) => t.name) : [];

  return (
    <section id="packages" className="scroll-mt-24 py-24 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Simple monthly plans. No setup fees.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            One monthly price covers the build, the tools, the management and the improvements. Month to month, cancel anytime.
            Tap any item to see what it is and how it looks.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <div className="inline-flex rounded-full bg-white p-1 shadow-sm border border-slate-200" role="tablist" aria-label="Plan type">
            {[
              { id: 'church', label: 'For churches', icon: Church },
              { id: 'business', label: 'For businesses', icon: Store },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn('flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors', tab === id ? 'bg-navy-600 text-white' : 'text-navy-700 hover:bg-slate-100')}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-full bg-white p-1 shadow-sm border border-slate-200" role="group" aria-label="Billing period">
            {[
              { v: false, label: 'Monthly' },
              { v: true, label: 'Annual' },
            ].map(({ v, label }) => (
              <button
                key={label}
                aria-pressed={annual === v}
                onClick={() => setAnnual(v)}
                className={cn('rounded-full px-5 py-2.5 text-sm font-semibold transition-colors', annual === v ? 'bg-navy-600 text-white' : 'text-navy-700 hover:bg-slate-100')}
              >
                {label}
              </button>
            ))}
            <span className="ml-1 mr-2 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">2 months free</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-6 items-stretch max-w-6xl mx-auto">
          {tiers.map((t) => (
            <PlanCard key={t.id} plan={t} annual={annual} onOpen={setFeature} liveLinks={liveLinks} />
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 max-w-6xl mx-auto">
          <h3 className="font-semibold text-navy-900 text-center mb-5">Included with every plan</h3>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {EVERY_PLAN.map((t) => (
              <li key={t} className="flex gap-2.5 text-slate-700 text-sm">
                <Check className="w-5 h-5 text-orange-500 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <Compare tab={tab} tiers={tiers} />

        <div className="mt-14 grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8">
            <h3 className="font-semibold text-navy-900 mb-3">How support works</h3>
            <ul className="space-y-2.5 text-sm text-slate-600 leading-relaxed">
              <li><b className="text-navy-900">Every plan:</b> questions answered within one business day, urgent issues the same day.</li>
              <li><b className="text-navy-900">{tab === 'church' ? 'Harvest' : 'Growth'}:</b> 2 hours of training to get your team comfortable, up to 2 small website updates a month (text, photos, events), and a strategy call every quarter.</li>
              <li><b className="text-navy-900">{tab === 'church' ? 'Legacy' : 'Partner'}:</b> we run it for you. Send requests any time and we batch website changes weekly. Priority, same-business-day replies and a 1-hour strategy call every month.</li>
              <li>Support covers questions, fixes and the work in your plan. It isn't a daily on-call help line, and bigger projects like redesigns are quoted separately.</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8">
            <h3 className="font-semibold text-navy-900 mb-3">{tab === 'church' ? 'Bigger church or multiple campuses?' : 'Bigger team or multiple locations?'}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {tab === 'church' ? 'Legacy' : 'Partner'} starts at the price above. Multi-campus {tab === 'church' ? 'churches' : 'businesses'} and larger teams get a custom quote on the free audit.
            </p>
            <h3 className="font-semibold text-navy-900 mb-2">Just need one thing?</h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>Website on its own: a one-time fee from $400 for a simple site, or $1,500 for a full site, hosted by TrueLink.</li>
              <li>Social media management by itself: from $500/month.</li>
            </ul>
            <Button variant="outline" className="mt-5" onClick={goToAudit}>Book a free audit</Button>
          </div>
        </div>
      </div>

      {feature && <FeatureModal id={feature} planNames={planNames} onClose={close} />}
    </section>
  );
}
