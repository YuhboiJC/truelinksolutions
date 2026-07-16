import { cn } from '@/lib/utils';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-navy-900',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
        className,
      )}
      {...props}
    />
  );
}
