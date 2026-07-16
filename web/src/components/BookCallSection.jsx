import { motion } from 'framer-motion';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/site';

const PERKS = [
  'No cost, no obligation — worst case you walk away with a free idea',
  "We'll look at what's eating your time and where automation could realistically help",
  'A real conversation with the person who\'d actually do the work — not a sales rep',
];

const BookCallSection = () => (
  <section id="book-call" className="relative py-24 md:py-28 bg-navy-700 overflow-hidden">
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/15 text-orange-300 text-sm font-semibold mb-6">
          Free 15-Minute Automation Audit
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Get a second pair of eyes on your business
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Book a free, no-pressure 15-minute call. We'll look at where you're losing time to repetitive
          tasks and hand you at least one automation idea you can use — whether or not we ever work
          together.
        </p>

        <ul className="grid sm:grid-cols-3 gap-4 mb-10 text-left max-w-3xl mx-auto">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-white/80 text-sm">
              <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <Button
          as="a"
          href={SITE.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="accent"
          className="text-base px-8 py-3.5"
        >
          <Calendar className="w-5 h-5" />
          Book Your Free Audit
        </Button>
      </motion.div>
    </div>
  </section>
);

export default BookCallSection;
