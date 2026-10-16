import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown, Bot, CalendarCheck, Check, Church, Clock, Globe, HeartHandshake, MessageSquareText,
  PhoneCall, PhoneMissed, Repeat, Share2, Sparkles, Store, UserX, Workflow, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubIcon, LinkedinIcon } from '@/components/icons/BrandIcons.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SignupForm from '@/components/SignupForm.jsx';
import BookCallSection from '@/components/BookCallSection.jsx';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const scrollToSection = (href) => {
  const element = document.querySelector(href);
  if (element) element.scrollIntoView({ behavior: 'smooth' });
};

const PAINS = [
  { icon: PhoneMissed, text: 'Calls go to voicemail while you are busy, and those callers try someone else.' },
  { icon: Repeat, text: 'You answer the same five questions all day: hours, prices, directions, service times.' },
  { icon: UserX, text: 'New leads and first-time visitors never hear back because nobody had time to follow up.' },
  { icon: Share2, text: 'Social media keeps slipping to the bottom of the to-do list.' },
  { icon: Globe, text: 'The website is out of date, or nobody is sure how to change it.' },
  { icon: Clock, text: 'You and your team (or volunteers) are stretched thin doing work a computer could do.' },
];

const SERVICES = [
  {
    icon: PhoneCall,
    title: 'Never Lose a Lead',
    plain: 'Missed a call? The caller gets a friendly text within seconds. Every form, call and message gets an instant reply and a follow-up until they book.',
    tech: 'Missed-call text-back, instant SMS and email replies, multi-step nurture sequences, all tracked in one lead dashboard.',
  },
  {
    icon: Bot,
    title: 'AI Chat & Phone Assistants',
    plain: 'A helpful assistant on your website and phone line that answers common questions and books appointments 24/7, in your voice.',
    tech: 'AI models trained on your own FAQs, services and policies, connected to your calendar, with a hand-off to a real person when needed.',
  },
  {
    icon: Share2,
    title: 'Social Media, Handled',
    plain: 'Consistent posts on Facebook, Instagram and more, written for you and scheduled for you. Review each one first, or let it run on autopilot.',
    tech: 'AI-assisted content calendars, sermon or video to post repurposing, scheduling and monthly performance reporting.',
  },
  {
    icon: Globe,
    title: 'Websites That Work for You',
    plain: 'A fast, modern website that is easy for customers to use on their phone and easy for you to keep current.',
    tech: 'Mobile-first builds, local SEO, chat and booking built in, hosting, security updates and content changes included.',
  },
  {
    icon: CalendarCheck,
    title: 'Reminders That Cut No-Shows',
    plain: 'Automatic reminders before appointments, events and volunteer shifts, so fewer people forget.',
    tech: 'Scheduled text and email reminders tied to your booking calendar, with easy confirm and reschedule links.',
  },
  {
    icon: Workflow,
    title: 'AI Agent Management',
    plain: 'Your own team of AI helpers built around the jobs that eat your week, and managed by us so they keep working.',
    tech: 'Custom multi-step AI agents with human approval steps, monitoring, monthly improvements and clear ownership of your data.',
  },
];

const AUDIENCES = [
  {
    icon: Store,
    title: 'For local businesses',
    intro: 'Contractors, clinics, salons, shops, property managers and other service businesses.',
    points: [
      'Every missed call gets a text back in seconds',
      'Quotes and appointment requests get an instant reply',
      'Fewer no-shows with automatic reminders',
      'Google reviews requested after every job',
      'Social media and website kept fresh without your time',
    ],
  },
  {
    icon: Church,
    title: 'For churches and ministries',
    intro: 'Pastors, church offices and volunteer tech teams who want to reach more people without burning out.',
    points: [
      'First-time guests get a warm follow-up the same day',
      "Sunday's message turns into a week of posts, notes and a newsletter",
      'Service times, events and prayer requests answered 24/7',
      'Livestream, YouTube and website kept running smoothly',
      'Event and volunteer reminders sent automatically',
    ],
  },
];

const STEPS = [
  { title: 'Free 15-minute audit', text: "We talk through where your time goes and where leads slip away. You leave with at least one idea you can use, whether or not we work together." },
  { title: 'We build it for you', text: 'We set up your tools in about 1 to 3 weeks, using your words, your hours and your brand. No tech skills needed on your end.' },
  { title: 'You approve, then it goes live', text: 'Nothing goes out without your OK. We show you how it works in plain English before we flip the switch.' },
  { title: 'We manage and improve it', text: 'Every month we monitor, fix and fine-tune, and you get a simple report on calls answered, leads captured and hours saved.' },
];

const PACKAGES = {
  business: [
    {
      name: 'Essentials',
      promise: 'Never lose another lead',
      monthly: 297,
      setup: '997',
      features: [
        'Missed-call text-back',
        'Website chat assistant trained on your FAQs',
        'Instant lead follow-up by text and email',
        'Appointment reminders',
        'Google review requests',
        'Lead dashboard and monthly report',
      ],
    },
    {
      name: 'Growth',
      promise: 'Your front office runs itself',
      monthly: 697,
      setup: '2,497',
      popular: true,
      features: [
        'Everything in Essentials',
        '24/7 AI phone receptionist that books appointments',
        'Social media management (12 posts a month, 2 platforms)',
        'Monthly email newsletter and follow-up sequences',
        'New or refreshed 5-page website',
        'Quarterly strategy call',
      ],
    },
    {
      name: 'Partner',
      promise: 'Your own AI team, managed for you',
      monthly: 1497,
      setup: '4,997',
      from: true,
      features: [
        'Everything in Growth',
        '2 to 4 custom AI agents built around your workflows',
        'Social media on 3 platforms with short video clips',
        'Ongoing website updates',
        'Monitoring, monthly improvements and priority support',
        'Monthly strategy call',
      ],
    },
  ],
  church: [
    {
      name: 'Seed',
      promise: 'No visitor or prayer request falls through the cracks',
      monthly: 197,
      setup: '697',
      features: [
        'Website assistant for service times, events and directions',
        'First-time guest follow-up by text and email',
        'Prayer request intake and routing',
        'Event and volunteer reminders',
        'Weekly announcements email',
      ],
    },
    {
      name: 'Harvest',
      promise: "Sunday's message reaches people all week",
      monthly: 497,
      setup: '1,997',
      popular: true,
      features: [
        'Everything in Seed',
        'Sermon to content: weekly posts, sermon notes and newsletter',
        'Facebook and Instagram scheduling',
        'YouTube titles and descriptions written every week',
        'New or refreshed church website',
      ],
    },
    {
      name: 'Legacy',
      promise: 'A full tech team, without the payroll',
      monthly: 997,
      setup: '3,997',
      from: true,
      features: [
        'Everything in Harvest',
        'Livestream setup and support',
        'Custom AI agents (knowledge assistant, appointment scheduling)',
        'Full website management and online giving setup',
        'Pastor dashboard',
        'Monthly strategy call',
      ],
    },
  ],
};

const FAQS = [
  { q: 'Do I need to be good with technology?', a: "No. We set everything up, explain it in plain English, and manage it for you. If you can read a text message, you can use what we build." },
  { q: 'Will AI say something wrong to my customers?', a: 'Your assistant only answers from information you approve, and it hands tricky questions to a real person. You decide whether posts and emails wait for your OK or go out automatically, and you can change that any time.' },
  { q: 'Who owns my website, content and contacts?', a: 'You do. Your website, domain, content and customer list are yours, in writing. If you ever leave, you take them with you.' },
  { q: 'Is there a long contract?', a: 'Plans have a 3-month minimum so we can get everything working well, then they are month to month. Cancel any time after that.' },
  { q: 'What does the monthly fee cover?', a: 'Hosting, the tools themselves, monitoring, fixes, updates, the work included in your plan, and a simple monthly report. No surprise invoices.' },
  { q: 'Can you work with the tools I already use?', a: "Usually, yes. We connect to common calendars, email, phone systems, Facebook, Instagram, YouTube and church platforms. We'll check yours on the free audit." },
  { q: 'Do you only work with churches and businesses in Southwest Florida?', a: "No. We started in Port Charlotte and still meet local clients in person, from Venice to Fort Myers. We're growing across Florida and work with clients anywhere over video calls." },
];

const fmt = (n) => n.toLocaleString('en-US');

function Pricing() {
  const [tab, setTab] = useState('business');
  const tiers = PACKAGES[tab];
  return (
    <section id="packages" className="scroll-mt-24 py-24 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Packages</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Simple monthly plans that pay for themselves. One-time setup covers the build; the monthly fee covers the tools, the management and the improvements.
          </p>
        </motion.div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full bg-white p-1 shadow-sm border border-slate-200" role="tablist">
            {[
              { id: 'business', label: 'For businesses', icon: Store },
              { id: 'church', label: 'For churches', icon: Church },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                  tab === id ? 'bg-navy-600 text-white' : 'text-navy-700 hover:bg-slate-100',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={cn(
                'relative flex flex-col rounded-2xl bg-white p-8 border',
                t.popular ? 'border-orange-400 shadow-xl lg:-translate-y-2' : 'border-slate-200 shadow-sm',
              )}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-navy-900">{t.name}</h3>
              <p className="text-slate-600 mt-1 min-h-12">{t.promise}</p>
              <p className="mt-5">
                {t.from && <span className="text-sm text-slate-500 mr-1">from</span>}
                <span className="text-4xl font-bold text-navy-900">${fmt(t.monthly)}</span>
                <span className="text-slate-500">/month</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">{t.from ? 'Setup from' : 'Plus'} ${t.setup} one-time setup</p>
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-slate-700 text-sm leading-relaxed">
                    <Check className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={t.popular ? 'accent' : 'outline'}
                className="mt-8 w-full"
                onClick={() => scrollToSection('#book-call')}
              >
                Start with a free audit
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8 max-w-2xl mx-auto">
          Not sure which fits? That's what the free audit is for. We also build websites on their own (from $1,500) and
          offer social media management by itself (from $500/month).
        </p>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Questions people ask</h2>
          <p className="text-lg text-slate-600">Straight answers, no fine print.</p>
        </motion.div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                className="w-full flex items-center justify-between gap-4 py-5 text-left"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span className="font-semibold text-navy-900">{f.q}</span>
                <ChevronDown className={cn('w-5 h-5 text-slate-400 shrink-0 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && <p className="pb-5 -mt-1 text-slate-600 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const HomePage = () => {
  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <section id="home" className="relative min-h-svh flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1684395165684-1210bdc81d96" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-navy-700/95 via-navy-600/85 to-orange-600/70" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center mt-12 md:mt-0">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-orange-200 mb-6">
                <Sparkles className="w-4 h-4" /> AI automation for Southwest Florida businesses and churches
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                Less busywork. More time for the people you serve.
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                We set up AI helpers that answer your calls, follow up with every lead, post to your social media and
                keep your website working, then we manage them for you. Built and run by a local Port Charlotte
                business owner, explained in plain English.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="accent" className="text-base px-8 py-3.5" onClick={() => scrollToSection('#book-call')}>
                  Book a Free 15-Min Audit
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => scrollToSection('#packages')}>
                  See packages and pricing
                  <ArrowDown className="ml-1 h-4 w-4 animate-bounce" />
                </Button>
              </div>
              <p className="text-white/70 text-sm mt-6">No cost, no pressure. You'll leave with at least one idea you can use.</p>
            </motion.div>
          </div>
        </section>

        {/* Pain points */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Sound familiar?</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Most small businesses and churches don't need more software. They need the repetitive stuff to just get done.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PAINS.map(({ icon: Icon, text }, i) => (
                <motion.div key={text} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }} className="flex gap-4 rounded-xl bg-slate-50 p-5">
                  <Icon className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-slate-700 leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-lg font-medium text-navy-700 mt-10">
              Every one of these can run on its own, quietly, in the background.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section id="mission" className="scroll-mt-24 py-20 bg-navy-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <p className="text-orange-300 font-semibold mb-3">Our mission</p>
              <h2 className="text-3xl md:text-4xl font-bold max-w-3xl mx-auto leading-snug">
                Give every local business and church the same AI tools big companies use, set up for you and managed so they keep working.
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Workflow, title: 'What we do', text: 'We build and manage AI assistants, automations, websites and social media that handle the repetitive work, so nothing and no one slips through the cracks.' },
                { icon: HeartHandshake, title: 'Our goal', text: 'Give you back hours every week and turn more calls, visitors and followers into customers and members, without adding staff or stress.' },
                { icon: Store, title: 'Who we are', text: "A small, local company in Port Charlotte. You work directly with the founder, a small business owner and church tech volunteer who knows what a busy week feels like." },
              ].map(({ icon: Icon, title, text }) => (
                <motion.div key={title} {...fadeUp} className="rounded-2xl bg-white/5 border border-white/10 p-7">
                  <Icon className="w-7 h-7 text-orange-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-white/80 leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-24 py-24 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">What we do</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Plain-English answers first. For the technical folks, the details are right underneath.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map(({ icon: Icon, title, plain, tech }, index) => (
                <motion.div
                  key={title}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="flex flex-col bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
                  <p className="text-slate-700 leading-relaxed flex-1">{plain}</p>
                  <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 leading-relaxed">
                    <span className="font-semibold text-navy-600">Under the hood: </span>{tech}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section id="who" className="scroll-mt-24 py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Built for businesses and churches</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Different missions, same problem: too much to do and not enough hands.</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {AUDIENCES.map(({ icon: Icon, title, intro, points }) => (
                <motion.div key={title} {...fadeUp} className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center"><Icon className="w-6 h-6 text-navy-600" /></div>
                    <h3 className="text-xl font-bold text-navy-900">{title}</h3>
                  </div>
                  <p className="text-slate-600 mb-5">{intro}</p>
                  <ul className="space-y-3">
                    {points.map((p) => (
                      <li key={p} className="flex gap-2.5 text-slate-700">
                        <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">How it works</h2>
              <p className="text-lg text-slate-600">Four steps, and you are only needed for the first and third.</p>
            </motion.div>
            <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <motion.li key={s.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }} className="relative rounded-2xl border border-slate-200 p-6">
                  <span className="flex w-10 h-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold mb-4">{i + 1}</span>
                  <h3 className="font-semibold text-navy-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.text}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <Pricing />

        {/* Featured project */}
        <section id="work" className="scroll-mt-24 py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <p className="text-orange-600 font-semibold mb-3">Featured project</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-5">A two-campus church, running on one connected system</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We're finishing a full Legacy-level build for a growing church here in Southwest Florida. Their small
                volunteer team was doing everything by hand: livestreams, the website, social posts, newsletters and
                scheduling for weekly prayer appointments.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Now each Sunday message becomes a week of posts, notes and a newsletter, ready for their approval.
                Their livestream, YouTube details, website and appointment scheduling all run on one connected system.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-2xl bg-slate-50 border border-slate-200 p-8">
              <h3 className="font-semibold text-navy-900 mb-4">What we built</h3>
              <ul className="space-y-3">
                {[
                  'Sermon to content engine (posts, sermon notes, newsletter)',
                  'Social media automation for Facebook and Instagram',
                  'Livestream setup and weekly YouTube updates',
                  'New church website',
                  'Email automation and outreach',
                  'Scheduling workflow for weekly ministry appointments',
                ].map((p) => (
                  <li key={p} className="flex gap-2.5 text-slate-700"><Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />{p}</li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-500 italic">Their review is coming soon, straight from the church.</p>
            </motion.div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-24 py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden md:flex">
              <div className="md:w-2/5 bg-slate-100 h-80 md:h-auto">
                {/* Photo from Josh's GitHub profile. Swap for a professional headshot later (e.g. /josh.jpg). */}
                <img
                  src="https://avatars.githubusercontent.com/u/86496695?s=600&v=4"
                  alt="Josh McLaughlin"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="p-8 md:p-10 md:w-3/5">
                <p className="text-orange-600 font-semibold mb-2">Who you'll work with</p>
                <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">{SITE.founder}</h2>
                <p className="text-slate-500 mb-5">Founder, {SITE.name} · Port Charlotte, FL</p>
                <p className="text-slate-600 leading-relaxed mb-4">
                  I'm a small business owner with more than five years of IT and networking experience at AT&amp;T. My wife and I also serve on our church's tech team, so I know what it's like
                  to run livestreams, websites and social media on top of everything else.
                </p>
                <p className="text-slate-600 leading-relaxed mb-6">
                  I started {SITE.name} to give local businesses and churches the tools that used to be out of reach,
                  without the jargon and without the runaround. When you call, you get me.
                </p>
                <div className="flex gap-3">
                  <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="p-3 bg-slate-100 hover:bg-navy-600 hover:text-white text-navy-700 rounded-full transition-all"><LinkedinIcon className="w-5 h-5" /></a>
                  <a href={SITE.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile" className="p-3 bg-slate-100 hover:bg-navy-600 hover:text-white text-navy-700 rounded-full transition-all"><GithubIcon className="w-5 h-5" /></a>
                  <a href={SITE.phoneHref} className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-navy-600 hover:text-white text-navy-700 rounded-full transition-all text-sm font-semibold"><PhoneCall className="w-4 h-4" />{SITE.phone}</a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Our promise */}
        <section id="promise" className="scroll-mt-24 py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">Our promise to every client</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We're a young company, so instead of a wall of logos, here's exactly what you can hold us to.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: 'Plain English, always', text: "No jargon and no runaround. If something doesn't make sense, that's on us to fix." },
                { title: 'You choose how hands-on to be', text: 'Want to approve every post and email first? You can. Rather not think about it? We set it to run on its own in the background, and you just see the results.' },
                { title: 'You own your stuff', text: 'Your website, domain, content and contact list belong to you, in writing.' },
                { title: 'A real person, not a call center', text: 'You work directly with the founder. We started in Port Charlotte and are growing across Florida, by phone, text, email, video or in person.' },
                { title: 'Fast replies', text: 'Questions answered within one business day, and urgent issues the same day.' },
                { title: 'No long contracts', text: 'A 3-month minimum to get everything working well, then month to month.' },
              ].map(({ title, text }, i) => (
                <motion.div key={title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }} className="rounded-2xl border border-slate-200 p-6">
                  <Check className="w-6 h-6 text-orange-500 mb-3" />
                  <h3 className="font-semibold text-navy-900 mb-1.5">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Faq />

        <BookCallSection />

        {/* Newsletter */}
        <section id="newsletter" className="scroll-mt-24 py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MessageSquareText className="w-10 h-10 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-3">Not ready to talk? Get TrueLink AI Weekly, free.</h2>
            <p className="text-slate-600 mb-8">
              One email every Friday: the AI news that matters, a heads up on new scams, and one practical tip you can
              try in about ten minutes. Written in plain English.
            </p>
            <div className="flex justify-center"><SignupForm /></div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
