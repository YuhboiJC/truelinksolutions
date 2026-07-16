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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await signup({ name: name.trim(), email: email.trim() });
      toast.success("You're in! Check your inbox — your free automation tip is on its way.");
      setEmail('');
      setName('');
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = 'h-12 text-base bg-white text-navy-900 placeholder:text-slate-400';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="First name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn('sm:w-40', inputClasses)}
          autoComplete="given-name"
        />
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
          className="h-12 px-8 whitespace-nowrap"
        >
          {isLoading ? 'Sending…' : 'Get Free Tips'}
        </Button>
      </div>
      <p className={cn('mt-2 text-xs', variant === 'hero' ? 'text-white/70' : 'text-slate-500')}>
        We'll send a few genuinely useful emails — no spam, unsubscribe anytime.
      </p>
    </form>
  );
};

export default SignupForm;
