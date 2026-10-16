// Single place to update brand contact details / links used across the site.
// Email templates live in Supabase (supabase/functions/_shared) and read the
// Calendly link + mailing address from the business_profile table, which you
// can edit in TrueLink HQ → Settings.
export const SITE = {
  name: 'TrueLink Solutions',
  founder: 'Josh McLaughlin',
  email: 'info@truelinksolutions.com',
  phone: '(941) 840-3649',
  phoneHref: 'tel:+19418403649',
  region: 'Southwest Florida',
  calendlyUrl: 'https://calendly.com/truelinksolutions-info/15min',
  github: 'https://github.com/YuhboiJC',
  linkedin: 'https://www.linkedin.com/in/josh-mclaughlin-371322212/',
};
