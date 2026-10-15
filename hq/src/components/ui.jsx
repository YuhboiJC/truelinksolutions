import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { INVOICE_TONE, STATUS } from '@/lib/format';

export function Badge({ tone, children }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', tone)}>
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }) => <Badge tone={STATUS[status]?.tone}>{STATUS[status]?.label ?? status}</Badge>;
export const InvoiceBadge = ({ status }) => <Badge tone={INVOICE_TONE[status]}>{status}</Badge>;

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-900/40 p-0 sm:p-4" onMouseDown={onClose}>
      <div
        className={clsx('card w-full max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="p-1 rounded-md text-slate-400 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon className="w-8 h-8 text-slate-300 mx-auto mb-3" />}
      <p className="font-medium text-navy-700">{title}</p>
      {children && <div className="text-sm text-slate-500 mt-1">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="w-5 h-5 border-2 border-navy-100 border-t-orange-500 rounded-full animate-spin mx-auto my-10" />;
}
