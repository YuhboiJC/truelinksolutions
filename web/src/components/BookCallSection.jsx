import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestAudit } from '@/lib/api';
import { SITE } from '@/lib/site';

const PERKS = [
  'No cost, no obligation — worst case you walk away with a free idea',
  "We'll look at what's eating your time and where automation could realistically help",
  'A real conversation with the person who\'d actually do the work — not a sales rep',
];

const EMPTY = { name: '', email: '', phone: '', business_name: '', message: '', company_website: '' };

function calendlyLink({ name, email }) {
  const url = new URL(SITE.calendlyUrl);
  if (name) url.searchParams.set('name', name);
  if (email) url.searchParams.set('email', email);
  return url.toString();
}

const BookCallSection = () => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please add your name');
    if (!form.email.includes('@')) return toast.error('Please enter a valid email address');
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
      await requestAudit(payload);
      setDone({ name: payload.name, email: payload.email });
      setForm(EMPTY);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = 'bg-white/95 text-navy-900';

  return (
    <section id="book-call" className="scroll-mt-24 relative py-24 md:py-28 bg-navy-700 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/15 text-orange-300 text-sm font-semibold mb-6">
            Free 15-Minute Automation Audit
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Get a second pair of eyes on your business or ministry
          </h2>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Book a free, no-pressure 15-minute call. We'll look at where you're losing time to repetitive
            tasks and hand you at least one automation idea you can use — whether or not we ever work
            together.
          </p>
          <ul className="space-y-3 text-left max-w-xl mx-auto lg:mx-0">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-white/80 text-sm">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-6 sm:p-8 border border-white/10"
        >
          {done ? (
            <div className="text-center py-6">
              <PartyPopper className="w-10 h-10 text-orange-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">You're on the list, {done.name.split(' ')[0]}!</h3>
              <p className="text-white/80 mb-8">
                Last step: pick a 15-minute time that works for you. We also sent this link to your inbox.
              </p>
              <Button
                as="a"
                href={calendlyLink(done)}
                target="_blank"
                rel="noopener noreferrer"
                variant="accent"
                className="text-base px-8 py-3.5"
              >
                <Calendar className="w-5 h-5" />
                Choose Your Time
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative space-y-3" noValidate>
              <h3 className="text-xl font-bold text-white mb-1">Request your free audit</h3>
              <p className="text-sm text-white/70 mb-4">Takes 30 seconds. You'll pick a time right after.</p>
              <input
                type="text"
                name="company_website"
                value={form.company_website}
                onChange={set('company_website')}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input placeholder="Your name *" value={form.name} onChange={set('name')} autoComplete="name" className={inputClasses} required />
                <Input type="email" placeholder="Email *" value={form.email} onChange={set('email')} autoComplete="email" className={inputClasses} required />
                <Input placeholder="Business name" value={form.business_name} onChange={set('business_name')} autoComplete="organization" className={inputClasses} />
                <Input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} autoComplete="tel" className={inputClasses} />
              </div>
              <textarea
                placeholder="What's eating up your time right now? (optional)"
                value={form.message}
                onChange={set('message')}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-base text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Button type="submit" variant="accent" disabled={loading} className="w-full text-base py-3.5">
                <Calendar className="w-5 h-5" />
                {loading ? 'Sending…' : 'Book Your Free Audit'}
              </Button>
              <p className="text-xs text-white/60 text-center">No spam. We only use this to prepare for your call.</p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default BookCallSection;
