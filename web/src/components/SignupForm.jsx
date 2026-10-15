import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signup } from '@/lib/api';
import { cn } from '@/lib/utils';

const SignupForm = ({ variant = 'default' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hp, setHp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signup({ name: name.trim(), email: email.trim(), company_website: hp });
      toast.success(res.message || "You're in! Check your inbox — your free automation tip is on its way.");
      setEmail('');
      setName('');
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = 'h-14 text-lg bg-white text-navy-900 placeholder:text-slate-400';

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg">
      {/* Honeypot: hidden from people, bots fill it in */}
      <input
        type="text"
        name="company_website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder="First name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClasses}
          autoComplete="given-name"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn('flex-1', inputClasses)}
            autoComplete="email"
            required
          />
          <Button
            type="submit"
            variant={variant === 'hero' ? 'accent' : 'primary'}
            disabled={isLoading}
            className="h-14 px-8 text-lg whitespace-nowrap"
          >
            {isLoading ? 'Sending…' : 'Get Free Tips'}
          </Button>
        </div>
      </div>
      <p className={cn('mt-2 text-xs', variant === 'hero' ? 'text-white/70' : 'text-slate-500')}>
        We'll send a few genuinely useful emails — no spam, unsubscribe anytime.
      </p>
    </form>
  );
};

export default SignupForm;
