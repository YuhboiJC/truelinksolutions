import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/site';

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Results', href: '#portfolio' },
  { label: 'About', href: '#about' },
  { label: 'Reviews', href: '#testimonials' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (href) => {
    setMenuOpen(false);
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('#home'); }} className="flex items-center gap-2">
          <img src="/logo.png" alt={SITE.name} className="h-10 w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={`font-medium transition-colors ${scrolled ? 'text-navy-700 hover:text-orange-500' : 'text-white hover:text-orange-200'}`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button variant="accent" onClick={() => scrollToSection('#book-call')}>
            Book a Free Audit
          </Button>
        </div>

        <button
          className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-navy-700' : 'text-white'}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t border-slate-100">
          <div className="px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-left py-2 font-medium text-navy-700 hover:text-orange-500"
              >
                {link.label}
              </button>
            ))}
            <Button variant="accent" onClick={() => scrollToSection('#book-call')} className="w-full">
              Book a Free Audit
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
