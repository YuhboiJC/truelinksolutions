import { motion } from 'framer-motion';
import { ArrowDown, MessageSquareText, PhoneCall, CalendarClock, Bot, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubIcon, LinkedinIcon } from '@/components/icons/BrandIcons.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SignupForm from '@/components/SignupForm.jsx';
import ServiceCard from '@/components/ServiceCard.jsx';
import PortfolioCard from '@/components/PortfolioCard.jsx';
import TestimonialCard from '@/components/TestimonialCard.jsx';
import BookCallSection from '@/components/BookCallSection.jsx';
import { SITE } from '@/lib/site';

const SERVICES = [
  {
    icon: PhoneCall,
    title: 'Missed-Call Text-Back',
    description: "Can't pick up? We text the caller back within seconds so that lead doesn't call your competitor next.",
  },
  {
    icon: Bot,
    title: '24/7 AI Chat & Voice Assistants',
    description: 'Answer common questions — hours, pricing, availability — instantly, any time of day, without tying up your team.',
  },
  {
    icon: CalendarClock,
    title: 'Appointment Reminders',
    description: 'Automated reminders the day before and hours before appointments, cutting no-shows without any manual follow-up.',
  },
  {
    icon: MessageSquareText,
    title: 'Lead Follow-Up Automation',
    description: 'Instant "we got your message" replies and nurture sequences that keep new leads warm until you can respond.',
  },
  {
    icon: Search,
    title: 'Website & SEO',
    description: 'Fast, modern websites built to convert, with technical SEO so local customers can actually find you.',
  },
  {
    icon: TrendingUp,
    title: 'Reporting & Insights',
    description: 'Simple dashboards that show what automation is actually saving you — hours back, leads captured, calls answered.',
  },
];

const PROJECTS = [
  {
    title: 'Automated Customer Service Chatbot',
    description: 'AI-powered chatbot handling 87% of customer inquiries automatically, providing instant responses 24/7 and reducing support costs.',
    metrics: '87% automation rate • 3.2min avg response time',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a',
  },
  {
    title: 'Social Media Management Automation',
    description: 'Automated content scheduling, engagement tracking, and performance analytics across multiple platforms with AI-generated insights.',
    metrics: '142% engagement increase • 18hrs saved weekly',
    image: 'https://images.unsplash.com/photo-1620829868801-8a443f0370f3',
    imageAlt: 'Social media analytics on a phone screen',
  },
  {
    title: 'Lead Generation Pipeline',
    description: 'Intelligent lead capture and nurturing system with automated follow-ups, scoring, and CRM integration for maximum conversion.',
    metrics: '64% conversion improvement • 2,847 qualified leads',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
  },
  {
    title: 'Website Optimization & SEO',
    description: 'Complete website redesign with technical SEO, performance optimization, and conversion-focused UX improvements.',
    metrics: '218% organic traffic growth • 4.7s load time',
    image: 'https://images.unsplash.com/photo-1586880244543-0528a802be97',
    imageAlt: 'Storefront website interface on a laptop',
  },
  {
    title: 'Email Marketing Automation',
    description: 'Personalized email campaigns with behavioral triggers, A/B testing, and advanced segmentation for higher engagement.',
    metrics: '47.2% open rate • 12.8% click-through rate',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
  },
  {
    title: 'Business Analytics Dashboard',
    description: 'Real-time business intelligence dashboard consolidating data from multiple sources with predictive analytics and custom reports.',
    metrics: '83% faster decision making • 12 data sources',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Truelink Solutions transformed our customer service. The AI chatbot handles most inquiries instantly, and our team can focus on complex issues. Response times dropped from hours to minutes.',
    name: 'Elena Rodriguez',
    business: 'Coastal Property Management',
    initials: 'ER',
    bgColor: 'bg-navy-500',
  },
  {
    quote: 'The social media automation saved us countless hours. Our engagement doubled, and we finally have data-driven insights to guide our strategy. Best investment we made this year.',
    name: 'Marcus Chen',
    business: 'Naples Wellness Center',
    initials: 'MC',
    bgColor: 'bg-orange-500',
  },
  {
    quote: 'Our lead conversion rate jumped 64% after implementing their automated pipeline. The system nurtures leads perfectly, and we close more deals with less manual work.',
    name: 'Sophia Patel',
    business: 'Gulf Coast Realty Group',
    initials: 'SP',
    bgColor: 'bg-navy-400',
  },
  {
    quote: "The website redesign and SEO work tripled our organic traffic. We went from page 3 to top rankings for our key terms. The ROI has been incredible.",
    name: "James O'Connor",
    business: 'Fort Myers Legal Services',
    initials: 'JO',
    bgColor: 'bg-orange-600',
  },
];

const scrollToSection = (href) => {
  const element = document.querySelector(href);
  if (element) element.scrollIntoView({ behavior: 'smooth' });
};

const HomePage = () => {
  return (
    <>
      <Header />

      <main>
        <section id="home" className="relative min-h-svh flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1684395165684-1210bdc81d96"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-navy-700/95 via-navy-600/85 to-orange-600/70" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center mt-12 md:mt-0">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                AI Automation for Southwest Florida Business Owners
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                Stop losing time and leads to missed calls, repetitive questions, and no-shows.
                Get automation that runs quietly in the background — built by a local small
                business owner, for local small business owners.
              </p>

              <div className="flex flex-col items-center gap-4 mb-10">
                <SignupForm variant="hero" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button variant="accent" onClick={() => scrollToSection('#book-call')}>
                  Book a Free 15-Min Audit
                </Button>
                <Button
                  onClick={() => scrollToSection('#services')}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  See how it works
                  <ArrowDown className="ml-1 h-4 w-4 animate-bounce" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 py-24 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">What We Automate</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Practical automation for the everyday things quietly costing service businesses time and money.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service, index) => (
                <ServiceCard key={service.title} index={index} {...service} />
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 relative py-24 overflow-hidden bg-slate-50">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">
                  Solving Real Business Challenges
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  We understand the unique challenges facing Southwest Florida businesses — limited
                  resources, growing competition, and never enough hours in the day.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Our approach combines proven AI automation with strategic digital presence so you can
                  work smarter, not harder — no "tech company" jargon required.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sm:flex"
              >
                <div className="sm:w-2/5 bg-slate-100 relative h-64 sm:h-auto shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1654277041218-84424c78f0ae"
                    alt="Josh McLaughlin"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-navy-900 mb-1">{SITE.founder}</h3>
                  <p className="text-orange-600 font-medium mb-4">Founder, {SITE.name}</p>
                  <p className="text-slate-600 leading-relaxed mb-6 text-sm">
                    Josh runs {SITE.name} out of Port Charlotte and is a small business owner himself.
                    He builds scalable, practical automation and digital-presence solutions for local
                    property managers, clinics, contractors, and shops.
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={SITE.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-100 hover:bg-navy-600 hover:text-white text-navy-700 rounded-full transition-all duration-300"
                      aria-label="GitHub Profile"
                    >
                      <GithubIcon className="w-5 h-5" />
                    </a>
                    <a
                      href={SITE.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-100 hover:bg-navy-600 hover:text-white text-navy-700 rounded-full transition-all duration-300"
                      aria-label="LinkedIn Profile"
                    >
                      <LinkedinIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="portfolio" className="scroll-mt-24 relative py-24 md:py-28 bg-white">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-navy-900 mb-6 tracking-tight">Results</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Proven solutions that drive real business results for Southwest Florida companies.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PROJECTS.map((project, index) => (
                <PortfolioCard key={project.title} index={index} {...project} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mt-20"
            >
              <p className="text-lg font-medium text-navy-900 mb-2">Ready to transform your business?</p>
              <p className="text-slate-600 mb-6 max-w-xl mx-auto">
                Drop your email below and we'll send over a quick automation idea you can use right
                away — plus a few more over the following weeks.
              </p>
              <div className="flex justify-center">
                <SignupForm />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="testimonials" className="scroll-mt-24 py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">What Our Clients Say</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Real results from real Southwest Florida businesses.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <TestimonialCard key={testimonial.name} index={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        <BookCallSection />
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
