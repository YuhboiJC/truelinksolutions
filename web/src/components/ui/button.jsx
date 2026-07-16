import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-navy-600 hover:bg-navy-700 text-white',
  accent: 'bg-orange-500 hover:bg-orange-600 text-white',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  outline: 'bg-transparent border border-navy-600 text-navy-600 hover:bg-navy-50',
};

export function Button({
  as: Comp = 'button',
  variant = 'primary',
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <Comp
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500',
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
