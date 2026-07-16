// Single place to update brand contact details / links used across the site.
// The PHP email templates in ../../../api/mailer.php have their own copy of
// these same values (frontend and backend build independently) — keep both
// in sync when you change something here. See DEPLOY.md.
export const SITE = {
  name: 'Truelink Solutions',
  founder: 'Josh McLaughlin',
  email: 'info@truelinksolutions.com',
  phone: '(941) 840-3649',
  phoneHref: 'tel:+19418403649',
  region: 'Southwest Florida',
  // TODO: replace with your real Calendly (or Cal.com) scheduling link.
  calendlyUrl: 'https://calendly.com/truelink-solutions/15min',
  github: 'https://github.com/YuhboiJC',
  linkedin: 'https://www.linkedin.com/in/josh-mclaughlin-371322212/',
};
