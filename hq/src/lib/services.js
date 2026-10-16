import { Bot, Boxes, Globe, HardDrive, Mail, MessageCircle, Newspaper, Radio, Server, Share2, Workflow, Wrench } from 'lucide-react';

export const CATEGORIES = [
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'domain', label: 'Domain', icon: Server },
  { value: 'hosting', label: 'Hosting', icon: HardDrive },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'ai_agent', label: 'AI agent', icon: Bot },
  { value: 'chat_assistant', label: 'Chat assistant', icon: MessageCircle },
  { value: 'automation', label: 'Automation', icon: Workflow },
  { value: 'newsletter', label: 'Newsletter', icon: Newspaper },
  { value: 'social_media', label: 'Social media', icon: Share2 },
  { value: 'livestream', label: 'Livestream', icon: Radio },
  { value: 'software', label: 'Software / tool', icon: Wrench },
  { value: 'other', label: 'Other', icon: Boxes },
];
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

export const SERVICE_STATUSES = [
  { value: 'planned', label: 'Planned', tone: 'bg-slate-100 text-slate-600 ring-slate-200' },
  { value: 'in_progress', label: 'Building', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { value: 'active', label: 'Active', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'paused', label: 'Paused', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'cancelled', label: 'Cancelled', tone: 'bg-slate-100 text-slate-400 ring-slate-200' },
];
export const SERVICE_STATUS = Object.fromEntries(SERVICE_STATUSES.map((s) => [s.value, s]));

export const CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one_time', label: 'One time' },
  { value: 'none', label: 'No charge / n/a' },
];

export const OWNERS = [
  { value: 'truelink', label: 'TrueLink account (we pay and manage it)' },
  { value: 'client', label: "Client's own account" },
];

/** Converts a per-cycle amount to a monthly figure. */
export const perMonth = (amount, cycle) =>
  amount == null ? 0 : cycle === 'monthly' ? Number(amount) : cycle === 'yearly' ? Number(amount) / 12 : 0;

export function daysUntil(d) {
  if (!d) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${d}T00:00:00`) - t) / 86400000);
}

export function renewalInfo(s) {
  const days = daysUntil(s.renews_on);
  if (days == null) return null;
  const needsAction = !(s.auto_renew && s.account_owner === 'truelink');
  const tone = days < 0 ? 'text-rose-600' : days <= 14 ? 'text-rose-600' : days <= 60 ? 'text-amber-600' : 'text-slate-500';
  const label = days < 0 ? `${-days} days overdue` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days <= 90 ? `In ${days} days` : null;
  return { days, tone, label, needsAction };
}
