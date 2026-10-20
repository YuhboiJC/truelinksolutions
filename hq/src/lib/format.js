// Pipeline colors: blue = lead, orange = prospect, green = customer, red = lost.
export const STATUSES = [
  { value: 'lead', label: 'Lead', tone: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500', bar: 'border-t-blue-500', head: 'bg-blue-50 text-blue-800' },
  { value: 'prospect', label: 'Prospect', tone: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500', bar: 'border-t-orange-500', head: 'bg-orange-50 text-orange-800' },
  { value: 'customer', label: 'Customer', tone: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-500', bar: 'border-t-green-500', head: 'bg-green-50 text-green-800' },
  { value: 'past', label: 'Past customer', tone: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400', bar: 'border-t-slate-400', head: 'bg-slate-100 text-slate-700' },
  { value: 'lost', label: 'Lost', tone: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500', bar: 'border-t-red-500', head: 'bg-red-50 text-red-800' },
];
export const STATUS = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

export const SOURCES = [
  { value: 'audit', label: 'Audit request' },
  { value: 'newsletter', label: 'Newsletter signup' },
  { value: 'manual', label: 'Added manually' },
  { value: 'referral', label: 'Referral' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'ai_agent', label: 'AI lead finder' },
  { value: 'other', label: 'Other' },
];
export const SOURCE = Object.fromEntries(SOURCES.map((s) => [s.value, s]));

export const INVOICE_TONE = {
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  void: 'bg-slate-100 text-slate-400 ring-slate-200',
  uncollectible: 'bg-rose-50 text-rose-600 ring-rose-200',
};

export const money = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format((cents || 0) / 100);

export const dollars = (n) =>
  n == null ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const date = (d) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export const today = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

export const displayName = (c) => c?.name || c?.business_name || c?.email || 'Unnamed';
