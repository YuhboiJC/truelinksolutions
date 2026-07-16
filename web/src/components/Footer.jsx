import { Mail, Phone } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/icons/BrandIcons.jsx';
import { SITE } from '@/lib/site';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-700 text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <img src="/logo.png" alt={SITE.name} className="h-10 w-auto mb-4 brightness-0 invert" />
          <p className="text-sm leading-relaxed max-w-xs">
            AI automation and digital presence for {SITE.region} service businesses — built by a small
            business owner, for small business owners.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <a href={`mailto:${SITE.email}`} className="hover:text-orange-300">{SITE.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0" />
              <a href={SITE.phoneHref} className="hover:text-orange-300">{SITE.phone}</a>
            </li>
          </ul>
          <div className="flex gap-3 mt-5">
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white/10 hover:bg-orange-500 rounded-full transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white/10 hover:bg-orange-500 rounded-full transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Truelink Solutions</h3>
          {/* CAN-SPAM requires a physical mailing address in commercial email footers.
              TODO: replace with your real business mailing address (a P.O. box is fine). */}
          <p className="text-sm leading-relaxed">
            [Your Business Mailing Address Here]<br />
            {SITE.region}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        &copy; {year} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
