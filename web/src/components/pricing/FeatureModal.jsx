import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, GraduationCap, LifeBuoy, Phone, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SERVICES } from './data';

function Bubble({ from, children }) {
  return (
    <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', from === 'biz' ? 'bg-navy-600 text-white ml-auto rounded-br-md' : 'bg-white text-navy-900 border border-slate-200 rounded-bl-md')}>
      {children}
    </div>
  );
}

// Simple illustrations for services without a live screenshot yet.
function Mock({ kind }) {
  if (kind === 'missed-call' || kind === 'review' || kind === 'phone') {
    const convo = {
      'missed-call': [
        ['note', 'Missed call from (941) 555-0182 · 2:14 PM'],
        ['biz', "Hi, this is Coastal Plumbing! Sorry we missed your call. We're on a job right now. How can we help?"],
        ['them', 'My water heater is leaking. Can someone come today?'],
        ['biz', 'We can be there between 4 and 6 PM. Reply YES to book it.'],
      ],
      review: [
        ['note', 'Job marked complete · sent 2 hours later'],
        ['biz', 'Thanks for choosing Coastal Plumbing today! How did we do? Tap to leave a quick Google review: g.page/r/…'],
        ['them', 'Great service, very fast. Done! ⭐⭐⭐⭐⭐'],
      ],
      phone: [
        ['note', 'Incoming call · 8:42 PM (after hours)'],
        ['biz', 'Thanks for calling Coastal Plumbing, this is the after-hours assistant. How can I help?'],
        ['them', 'I need someone to look at a slow drain this week.'],
        ['biz', 'I can book you Thursday at 10 AM or Friday at 1 PM. Which works better?'],
      ],
    }[kind];
    return (
      <div className="rounded-xl bg-slate-100 p-4 sm:p-6 space-y-2.5">
        {convo.map(([who, text], i) =>
          who === 'note' ? (
            <p key={i} className="text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-1.5">
              {kind === 'review' ? <Star className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              {text}
            </p>
          ) : (
            <Bubble key={i} from={who}>{text}</Bubble>
          ),
        )}
      </div>
    );
  }
  const Icon = { training: GraduationCap, call: CalendarClock, support: LifeBuoy }[kind] || CalendarClock;
  return (
    <div className="rounded-xl bg-navy-50 p-8 flex items-center justify-center">
      <Icon className="w-16 h-16 text-navy-400" strokeWidth={1.4} />
    </div>
  );
}

export default function FeatureModal({ id, planNames, onClose }) {
  const s = SERVICES[id];
  const [shot, setShot] = useState(0);
  const closeRef = useRef(null);

  useEffect(() => {
    setShot(0);
    if (!s) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [id, s, onClose]);

  if (!s) return null;
  const examples = s.examples || [];
  const current = examples[shot];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="feature-title">
      <button className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm cursor-default" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div className="relative w-full sm:max-w-3xl max-h-[92svh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white/95 backdrop-blur px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 id="feature-title" className="text-xl md:text-2xl font-bold text-navy-900">{s.title}</h3>
            {planNames?.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">Included in {planNames.join(', ')}</p>
            )}
          </div>
          <button ref={closeRef} onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-7">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-2">What it is</h4>
            <p className="text-slate-700 leading-relaxed">{s.what}</p>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-3">
              {current ? "See it in action at Healer's House" : 'How it looks'}
            </h4>
            {current ? (
              <figure>
                <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <img src={current.src} alt={current.caption} className="w-full h-auto block" loading="lazy" />
                </div>
                <figcaption className="text-sm text-slate-500 mt-2">{current.caption}</figcaption>
                {examples.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    {examples.map((e, i) => (
                      <button
                        key={e.src}
                        onClick={() => setShot(i)}
                        aria-label={`Example ${i + 1}`}
                        className={cn('h-14 w-20 overflow-hidden rounded-lg border-2', i === shot ? 'border-orange-500' : 'border-slate-200 opacity-70 hover:opacity-100')}
                      >
                        <img src={e.src} alt="" className="h-full w-full object-cover object-top" />
                      </button>
                    ))}
                  </div>
                )}
              </figure>
            ) : (
              <>
                <Mock kind={s.mock} />
                {['missed-call', 'review', 'phone'].includes(s.mock) && (
                  <p className="text-sm text-slate-500 mt-2">Illustration with a sample business.</p>
                )}
              </>
            )}
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-3">What you can do with it</h4>
            <ul className="space-y-2.5">
              {s.youCan.map((t) => (
                <li key={t} className="flex gap-2.5 text-slate-700">
                  <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
