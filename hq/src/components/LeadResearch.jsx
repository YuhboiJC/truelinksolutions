import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Copy, ExternalLink, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { leadAgentAction, supabase } from '@/lib/supabase';
import { dateTime } from '@/lib/format';

const copy = (text, what = 'Copied') =>
  navigator.clipboard?.writeText(text).then(() => toast.success(what), () => toast.error('Could not copy'));

function CopyBtn({ text, label = 'Copy' }) {
  if (!text) return null;
  return <button type="button" className="btn btn-ghost h-7 px-2 text-xs" onClick={() => copy(text)}><Copy className="w-3.5 h-3.5" />{label}</button>;
}

function Section({ title, open: initial = false, actions, children }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-t border-slate-100">
      <div className="flex items-center gap-2 px-5">
        <button type="button" onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 py-3 text-left text-sm font-semibold text-navy-900" aria-expanded={open}>
          <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', !open && '-rotate-90')} />{title}
        </button>
        {open && actions}
      </div>
      {open && <div className="px-5 pb-4 text-sm text-slate-700 space-y-2">{children}</div>}
    </div>
  );
}

const Bullets = ({ items }) => (items?.length ? <ul className="list-disc pl-5 space-y-1">{items.map((t, i) => <li key={i}>{t}</li>)}</ul> : null);
const Label = ({ children }) => <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-3 first:mt-0">{children}</p>;
const Pre = ({ children }) => <p className="whitespace-pre-line">{children}</p>;

function scriptText(s) {
  if (!s) return '';
  const a = s.stage_1_lead_to_warm ?? {}, b = s.stage_2_discovery ?? {}, c = s.stage_3_close ?? {};
  return [
    'STAGE 1: LEAD → WARM PROSPECT', a.goal && `Goal: ${a.goal}`, a.opener && `Opener: ${a.opener}`, a.value_hook && `Value: ${a.value_hook}`, a.ask && `Ask: ${a.ask}`,
    '', 'STAGE 2: DISCOVERY / FREE AUDIT', ...(b.questions ?? []).map((q) => `• ${q}`), b.listen_for?.length ? `Listen for: ${b.listen_for.join('; ')}` : '',
    '', 'STAGE 3: CLOSE', ...(c.demo_talking_points ?? []).map((q) => `• ${q}`), c.pitch && `Pitch: ${c.pitch}`, c.close && `Close: ${c.close}`,
    '', 'OBJECTIONS', ...(s.objections ?? []).map((o) => `"${o.objection}" → ${o.response}`),
    '', 'FOLLOW-UP', ...(s.follow_up_cadence ?? []).map((f) => `• ${f}`),
  ].filter((x) => x !== undefined && x !== false).join('\n');
}

/** AI research report for a lead, shown on the contact page. */
export default function LeadResearch({ contactId, onUpdated }) {
  const [row, setRow] = useState(undefined);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('lead_research').select('*').eq('contact_id', contactId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    setRow(data ?? null);
    return data;
  }, [contactId]);

  useEffect(() => {
    let timer;
    let wasRunning = false;
    const loop = async () => {
      const r = await load();
      if (r && ['pending', 'researching'].includes(r.status)) { wasRunning = true; timer = setTimeout(loop, 6000); }
      else if (wasRunning) onUpdated?.();
    };
    loop();
    return () => clearTimeout(timer);
  }, [load, onUpdated]);

  const run = async () => {
    setBusy(true);
    try {
      if (row?.status === 'failed') await leadAgentAction('retry', { research_id: row.id });
      else await leadAgentAction('research_contact', { contact_id: contactId });
      toast.success('The AI agent is researching them. This takes 1 to 2 minutes.');
      const poll = async () => { const r = await load(); if (r && ['pending', 'researching'].includes(r.status)) setTimeout(poll, 6000); else onUpdated?.(); };
      poll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (row === undefined) return null;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3">
      <h2 className="text-sm font-semibold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-violet-500" />AI lead research</h2>
      {(!row || ['done', 'failed'].includes(row.status)) && (
        <button className="btn btn-outline h-8" onClick={run} disabled={busy}>
          <RefreshCw className="w-3.5 h-3.5" />{row?.status === 'failed' ? 'Try again' : row ? 'Research again' : 'Research with AI'}
        </button>
      )}
    </div>
  );

  if (!row) {
    return (
      <section className="card">
        {header}
        <p className="px-5 pb-4 text-sm text-slate-500">Have the AI agent look them up: who's in charge, what they're missing, which plan fits, a sales script, outreach drafts and a demo-build prompt.</p>
      </section>
    );
  }

  if (row.status !== 'done') {
    return (
      <section className="card">
        {header}
        <div className="px-5 pb-4 text-sm">
          {row.status === 'failed' ? (
            <p className="text-red-600">Research didn't finish: {row.error}</p>
          ) : (
            <p className="flex items-center gap-2 text-violet-700"><Loader2 className="w-4 h-4 animate-spin" />{row.status === 'pending' ? 'Waiting in line…' : 'Researching now (1 to 2 minutes)…'}</p>
          )}
          {row.report?.discovery?.why_fit && <p className="text-slate-600 mt-2">{row.report.discovery.why_fit}</p>}
        </div>
      </section>
    );
  }

  const r = row.report ?? {};
  const org = r.organization ?? {};
  const op = r.online_presence ?? {};
  const s = r.sales_script ?? {};
  const out = r.outreach ?? {};
  const emailText = out.email ? `Subject: ${out.email.subject}\n\n${out.email.body}` : '';

  return (
    <section className="card overflow-hidden">
      {header}
      <div className="px-5 pb-4 text-sm">
        <p className="text-navy-900">{r.summary}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {r.recommended_plan?.plan && (
            <span className="rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-2.5 py-0.5 text-xs font-semibold">
              Recommended: {r.recommended_plan.plan}{r.recommended_plan.monthly_price ? ` ($${r.recommended_plan.monthly_price}/mo)` : ''}
            </span>
          )}
          {r.confidence && <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs">Confidence: {r.confidence}</span>}
          <span className="text-xs text-slate-400 self-center">Researched {dateTime(r.researched_at ?? row.updated_at)}</span>
        </div>
        {r.recommended_plan?.why && <p className="text-slate-600 mt-2">{r.recommended_plan.why}</p>}
      </div>

      <Section title="Who's in charge" open>
        {r.decision_makers?.length ? (
          <ul className="space-y-1.5">
            {r.decision_makers.map((d, i) => (
              <li key={i}>
                <b className="text-navy-900">{d.name}</b>, {d.role}
                {d.public_contact && !/not found/i.test(d.public_contact) && <span className="text-slate-500"> · {d.public_contact}</span>}
                {d.source && /^https?:/.test(d.source) && <a href={d.source} target="_blank" rel="noreferrer" className="ml-1 text-slate-400 hover:text-orange-600 inline-flex"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </li>
            ))}
          </ul>
        ) : <p className="text-slate-500">No names found publicly.</p>}
        <Label>About them</Label>
        <ul className="space-y-0.5 text-slate-600">
          {[['Type', org.denomination_or_industry || org.category], ['Size', org.size], ['Address', org.address], ['Phone', org.phone], ['Email', org.email], ['Website', org.website], [org.hours_or_service_times ? 'Hours / services' : '', org.hours_or_service_times]]
            .filter(([k, v]) => k && v && !/not found/i.test(v)).map(([k, v]) => <li key={k}><span className="text-slate-400">{k}:</span> {v}</li>)}
        </ul>
      </Section>

      <Section title="What they're missing" open>
        <Bullets items={r.gaps} />
        {(op.website || op.social?.length || op.reviews) && <Label>Online presence</Label>}
        {op.website && <p><span className="text-slate-400">Website:</span> {op.website}</p>}
        {op.social?.length > 0 && <Bullets items={op.social} />}
        {op.reviews && <p><span className="text-slate-400">Reviews:</span> {op.reviews}</p>}
      </Section>

      <Section title="How TrueLink helps">
        <ul className="space-y-1.5">{(r.opportunities ?? []).map((o, i) => <li key={i}><b className="text-navy-900">{o.need}:</b> {o.how_truelink_helps}</li>)}</ul>
      </Section>

      <Section title="Sales script: lead → prospect → customer" actions={<CopyBtn text={scriptText(s)} label="Copy script" />}>
        {s.stage_1_lead_to_warm && (
          <>
            <Label>1. Turn the lead into a warm prospect</Label>
            {s.stage_1_lead_to_warm.goal && <p className="text-slate-500">{s.stage_1_lead_to_warm.goal}</p>}
            {s.stage_1_lead_to_warm.opener && <p><b>Opener:</b> {s.stage_1_lead_to_warm.opener}</p>}
            {s.stage_1_lead_to_warm.value_hook && <p><b>Why it matters to them:</b> {s.stage_1_lead_to_warm.value_hook}</p>}
            {s.stage_1_lead_to_warm.ask && <p><b>Ask:</b> {s.stage_1_lead_to_warm.ask}</p>}
          </>
        )}
        {s.stage_2_discovery && (
          <>
            <Label>2. Discovery call / free audit</Label>
            <Bullets items={s.stage_2_discovery.questions} />
            {s.stage_2_discovery.listen_for?.length > 0 && <p className="text-slate-500">Listen for: {s.stage_2_discovery.listen_for.join('; ')}</p>}
          </>
        )}
        {s.stage_3_close && (
          <>
            <Label>3. Close as a customer</Label>
            <Bullets items={s.stage_3_close.demo_talking_points} />
            {s.stage_3_close.pitch && <p><b>Pitch:</b> {s.stage_3_close.pitch}</p>}
            {s.stage_3_close.close && <p><b>Close:</b> {s.stage_3_close.close}</p>}
          </>
        )}
        {s.objections?.length > 0 && (
          <>
            <Label>Objections</Label>
            <ul className="space-y-1.5">{s.objections.map((o, i) => <li key={i}><b>&ldquo;{o.objection}&rdquo;</b><br />{o.response}</li>)}</ul>
          </>
        )}
        {s.follow_up_cadence?.length > 0 && (<><Label>Follow-up plan</Label><Bullets items={s.follow_up_cadence} /></>)}
      </Section>

      {(out.email || out.sms || out.call) && (
        <Section title="Outreach drafts">
          {out.email && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between"><Label>Email</Label><CopyBtn text={emailText} /></div>
              <p className="font-medium text-navy-900">{out.email.subject}</p>
              <Pre>{out.email.body}</Pre>
            </div>
          )}
          {out.sms && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between"><Label>SMS</Label><CopyBtn text={out.sms} /></div>
              <Pre>{out.sms}</Pre>
              <p className="text-xs text-amber-700 mt-1">Only send after they've shared their number or agreed to texts.</p>
            </div>
          )}
          {out.call && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between"><Label>Call</Label><CopyBtn text={`Opening: ${out.call.opening}\n\nVoicemail: ${out.call.voicemail}`} /></div>
              {out.call.opening && <p><b>Opening:</b> {out.call.opening}</p>}
              {out.call.voicemail && <p><b>Voicemail:</b> {out.call.voicemail}</p>}
            </div>
          )}
        </Section>
      )}

      <Section title="Brief: everything they could use" actions={<CopyBtn text={r.brief} />}>
        <Pre>{r.brief}</Pre>
      </Section>

      <Section title="Demo build prompt (middle-tier package)" actions={<CopyBtn text={r.demo_prompt} label="Copy prompt" />}>
        <p className="text-slate-500">Paste this into Claude Code to build a branded demo before your discovery call.</p>
        <pre className="whitespace-pre-wrap text-xs bg-slate-50 rounded-lg p-3 max-h-80 overflow-y-auto font-mono">{r.demo_prompt}</pre>
      </Section>

      {r.sources?.length > 0 && (
        <Section title={`Sources (${r.sources.length})`}>
          <ul className="space-y-1">
            {r.sources.map((src, i) => (
              <li key={i}><a href={src.url} target="_blank" rel="noreferrer" className="text-navy-600 hover:text-orange-600 break-all">{src.title || src.url}</a></li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">Double-check names and contact details before reaching out.</p>
        </Section>
      )}
    </section>
  );
}
