import { useEffect, useState } from 'react';
import { Church, Mail, MessageSquare, Phone, Sparkles, Store } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { leadAgentAction } from '@/lib/supabase';
import { Modal, Spinner } from './ui';

const NEEDS = {
  church: ['Website', 'Social media management', 'Automation', 'AI chat assistant', 'Email newsletter', 'Online giving', 'Livestream'],
  business: ['Website', 'Social media management', 'Automation', 'AI chat assistant', 'Online booking', 'Google reviews', 'AI phone receptionist', 'Email newsletter'],
};
const OUTREACH = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'call', label: 'Call', icon: Phone },
];
const COUNTS = [3, 5, 10, 15, 25];

function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx('rounded-full px-3 py-1.5 text-sm font-medium border transition-colors', on ? 'bg-navy-600 border-navy-600 text-white' : 'bg-white border-slate-200 text-navy-700 hover:bg-slate-50')}
    >
      {children}
    </button>
  );
}

/** Pop-up for the AI lead finder: what to look for and how we'll reach out. */
export default function LeadFinder({ onClose, onStarted }) {
  const [connected, setConnected] = useState(null);
  const [key, setKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [audience, setAudience] = useState('church');
  const [count, setCount] = useState(5);
  const [needs, setNeeds] = useState(['Website', 'Social media management']);
  const [outreach, setOutreach] = useState(['email', 'call']);
  const [area, setArea] = useState('Southwest Florida (Port Charlotte, Punta Gorda, North Port, Venice, Englewood, Fort Myers, Cape Coral)');
  const [niche, setNiche] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { leadAgentAction('status').then((r) => setConnected(r.connected)).catch(() => setConnected(false)); }, []);
  useEffect(() => { setNeeds((n) => n.filter((x) => NEEDS[audience].includes(x))); }, [audience]);

  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const saveKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      await leadAgentAction('save_key', { key });
      setKey('');
      setConnected(true);
      toast.success('AI lead finder connected');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingKey(false);
    }
  };

  const start = async (e) => {
    e.preventDefault();
    if (!outreach.length) return toast.error('Pick at least one outreach method');
    setBusy(true);
    try {
      await leadAgentAction('start', { audience, count, needs, outreach, area, niche, notes });
      toast.success(`The AI agent is looking for ${count} ${audience === 'church' ? 'churches' : 'businesses'}. Progress shows at the top of the pipeline.`);
      onStarted?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Find leads with AI" onClose={onClose} wide>
      {connected === null ? <Spinner /> : !connected ? (
        <form onSubmit={saveKey} className="space-y-3 text-sm">
          <p className="text-slate-600">
            The lead finder uses Claude with web search. Add an Anthropic API key once: go to <a className="underline text-navy-600" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com → API keys</a>, create a key named &ldquo;TrueLink HQ&rdquo;, and paste it here. It's stored on the server and never shown again.
          </p>
          <p className="text-slate-500">Tip: set a monthly spend limit in the Console (Settings → Limits). Each researched lead costs roughly $0.20 to $0.40.</p>
          <input className="input font-mono" type="password" autoComplete="off" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
          <button className="btn btn-navy" disabled={savingKey || !key.trim()}>{savingKey ? 'Checking…' : 'Connect'}</button>
        </form>
      ) : (
        <form onSubmit={start} className="space-y-5">
          <div>
            <p className="label">What kind of leads?</p>
            <div className="grid grid-cols-2 gap-2">
              {[['church', 'Churches', Church], ['business', 'Businesses', Store]].map(([v, label, Icon]) => (
                <button key={v} type="button" aria-pressed={audience === v} onClick={() => setAudience(v)}
                  className={clsx('flex items-center justify-center gap-2 rounded-lg border-2 h-12 font-semibold', audience === v ? 'border-orange-500 bg-orange-50 text-navy-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
                  <Icon className="w-5 h-5" />{label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
            <div>
              <p className="label">How many?</p>
              <div className="flex gap-1.5">
                {COUNTS.map((n) => <Chip key={n} on={count === n} onClick={() => setCount(n)}>{n}</Chip>)}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="lf-niche">{audience === 'church' ? 'Kind of church (optional)' : 'Industry (optional)'}</label>
              <input id="lf-niche" className="input" value={niche} onChange={(e) => setNiche(e.target.value)}
                placeholder={audience === 'church' ? 'e.g. non-denominational, Baptist, under 300 members' : 'e.g. HVAC, plumbers, salons, dentists'} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="lf-area">Area</label>
            <input id="lf-area" className="input" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>

          <div>
            <p className="label">What could they benefit from?</p>
            <div className="flex flex-wrap gap-1.5">
              {NEEDS[audience].map((n) => <Chip key={n} on={needs.includes(n)} onClick={() => toggle(needs, setNeeds, n)}>{n}</Chip>)}
            </div>
          </div>

          <div>
            <p className="label">How should we reach out?</p>
            <div className="flex flex-wrap gap-1.5">
              {OUTREACH.map(({ value, label, icon: Icon }) => (
                <Chip key={value} on={outreach.includes(value)} onClick={() => toggle(outreach, setOutreach, value)}>
                  <span className="inline-flex items-center gap-1.5"><Icon className="w-4 h-4" />{label}</span>
                </Chip>
              ))}
            </div>
            {outreach.includes('sms') && (
              <p className="text-xs text-amber-700 mt-2">Texting rules: only text a number after they've given it to you or agreed to texts. The agent writes the SMS for that moment, with &ldquo;Reply STOP to opt out&rdquo;.</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="lf-notes">Anything else? (optional)</label>
            <textarea id="lf-notes" className="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Skip churches that already use Nucleus. Prefer ones with a Facebook page but no website." />
          </div>

          <div className="rounded-lg bg-violet-50 text-violet-900 text-sm p-3">
            <p className="font-medium flex items-center gap-1.5"><Sparkles className="w-4 h-4" />For each lead, the agent prepares:</p>
            <p className="mt-1 text-violet-800">Who runs it and how to reach them (public info only), what they're missing, how TrueLink helps and which plan fits, a 3-stage sales script (lead → warm prospect → customer), outreach drafts, a brief of everything they could use, and a prompt to build a branded {audience === 'church' ? 'Harvest' : 'Growth'} demo.</p>
            <p className="mt-1 text-violet-700 text-xs">Takes about 1 to 2 minutes per lead and runs in the background. Roughly ${(count * 0.3).toFixed(2)} in Claude usage for {count} leads.</p>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}><Sparkles className="w-4 h-4" />{busy ? 'Starting…' : `Find ${count} leads`}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
