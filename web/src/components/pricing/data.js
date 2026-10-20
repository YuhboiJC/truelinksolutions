// Pricing data for the Packages section.
// Edit prices, plan contents and pop-up text here. Nothing else needs to change.
//
// Annual pricing = 10 months for 12 ("two months free", about 17% off), the
// same discount SocialSermons uses.

export const ANNUAL_MONTHS = 10;

// Stripe Payment Links (or Checkout URLs) for each plan. Leave a value empty and
// the "Get started" button falls back to booking a free audit.
// Fill these in once the Stripe products are live (see STRIPE-SETUP.md).
export const CHECKOUT_LINKS = {
  seed: { monthly: '', annual: '' },
  harvest: { monthly: '', annual: '' },
  legacy: { monthly: '', annual: '' },
  essentials: { monthly: '', annual: '' },
  growth: { monthly: '', annual: '' },
  partner: { monthly: '', annual: '' },
};

const img = (name, caption) => ({ src: `/pricing/${name}.webp`, caption });

// ---------------------------------------------------------------------------
// Every service that appears in a plan. Clicking it on the site opens a pop-up
// with: what it is, an example from Healer's House Family Church, and what the
// customer can do with it. `mock` shows a simple illustration instead of a
// screenshot when there's no live example yet.
// ---------------------------------------------------------------------------
export const SERVICES = {
  // ----- Church -----
  'chat-assistant': {
    title: '24/7 website chat assistant',
    what: 'A friendly assistant on your website that answers visitor questions day and night, using only information you approve. Prayer and pastoral needs are always handed to a real person.',
    examples: [img('dash-assistant', "Healer's House: the assistant answered 96 questions this month and passed 6 to a person.")],
    youCan: [
      'Answer service times, directions, kids and ministry questions instantly, even at midnight',
      'See what people ask most, so you know what to put on the website and in announcements',
      'Have prayer requests and pastoral needs sent straight to the right person',
      'Update what it knows any time by telling us what changed',
    ],
  },
  'guest-followup': {
    title: 'First-time guest follow-up',
    what: 'When someone fills out "Plan a visit" or tells the assistant they are coming, they get a warm welcome by text and email the same day, plus a short follow-up series after their first Sunday.',
    examples: [
      img('site-welcome', "Healer's House website: \"Plan Your Visit\" starts the welcome series."),
      img('dash-email', 'Every new guest lands on your list with where they came from.'),
    ],
    youCan: [
      'Make every guest feel expected before they ever walk in',
      'See each new person and how they found you',
      'Choose who on your team gets notified about new guests',
      'Approve the welcome messages, or let them send on their own',
    ],
  },
  'prayer-requests': {
    title: 'Prayer request intake and routing',
    what: 'Prayer requests from your website, chat assistant and forms are collected in one place and sent to your prayer team right away, privately.',
    examples: [
      img('site-contact', "Healer's House: requests from the website go straight to the team."),
      img('dash-assistant', 'Prayer and pastoral needs are always passed to a person.'),
    ],
    youCan: [
      'Never lose a prayer request in an inbox again',
      'Send requests to the right team (prayer, pastoral care, healing rooms)',
      'Keep requests private and visible only to the people you choose',
    ],
  },
  reminders: {
    title: 'Event and volunteer reminders',
    what: 'Automatic text and email reminders before services, events and volunteer shifts, so fewer people forget and you stop sending reminders by hand.',
    examples: [
      img('dash-event', "Healer's House: the Thanksgiving Turkey Giveaway with volunteers, leaders and reminders in one view."),
      img('dash-calendar', 'Every service and special event on one calendar.'),
    ],
    youCan: [
      'Remind volunteers with one click, or let reminders go out on their own',
      'See who signed up and how many helpers you still need',
      'Give people easy confirm and "I can\'t make it" links',
    ],
  },
  'announcements-email': {
    title: 'Weekly announcements email',
    what: "A clean weekly email with this week's services, events and news, written for you from your calendar and sent to your church list.",
    examples: [img('dash-email', "Healer's House: 412 people on the list, with 58% opening the latest email.")],
    youCan: [
      'Keep your whole church informed without writing an email from scratch',
      'See who opens and clicks, and how your list is growing',
      'Approve each email before it goes, or let it send automatically',
    ],
  },
  'invite-graphic': {
    title: 'Weekly "Join us Sunday" graphic',
    what: 'One branded graphic each week inviting people to Sunday service, posted to Facebook and Instagram for you.',
    examples: [img('dash-content', 'Example: the "Bring a friend this Sunday" post from the Healer\'s House content page.')],
    youCan: [
      'Stay visible on social media every week with zero effort',
      'Give your members something easy to share with friends',
    ],
  },
  'portal-report': {
    title: 'TrueLink dashboard and monthly report',
    what: 'Your own login to the TrueLink dashboard with your plan, billing, basic numbers and account details, plus a simple monthly report in plain English.',
    examples: [img('dash-home', "The Healer's House dashboard (Legacy). Seed and Harvest show the same kind of numbers in the TrueLink dashboard.")],
    youCan: [
      'See website visitors, email opens and assistant questions at a glance',
      'Update your church profile, contacts and billing details yourself',
      'Upgrade, change or cancel your plan any time',
    ],
  },
  'sermon-content': {
    title: 'Sermon-to-content, every week',
    what: "We turn each Sunday message into a full week of posts: short sermon clips, quote and scripture graphics, and carousels. Everything is ready for your approval by Monday.",
    examples: [
      img('dash-content', "Healer's House: one sermon became a week of posts with graphics, waiting for approval."),
      img('dash-week', 'The week at a glance, and how last week\'s posts did.'),
    ],
    youCan: [
      'Approve, edit or redo any post with one click, or approve the whole week',
      'Paste a YouTube link or upload a file if the sermon was not livestreamed',
      'See which posts reached the most people',
      'Turn on autopilot so posts go out without review',
    ],
  },
  'social-scheduling': {
    title: 'Facebook and Instagram posting',
    what: 'Approved posts are scheduled at the best times for your church and posted for you. No logging in to Meta Business Suite.',
    examples: [img('dash-week', "Healer's House: the week's schedule and last week's results by platform.")],
    youCan: [
      'See exactly what goes out each day of the week',
      'Track reach, likes, shares and comments for every post',
      'Ask for a special post (event, announcement) any time',
    ],
  },
  'sermon-notes': {
    title: 'Sermon notes and discussion questions',
    what: 'A one-page summary of each message with key points, scriptures and questions for small groups, ready to print or post.',
    examples: [img('dash-content', 'Made from the same sermon as the week\'s posts.')],
    youCan: [
      'Hand Life Group and Bible study leaders ready-made discussion guides',
      'Post notes on your website so people can catch up on a missed Sunday',
    ],
  },
  newsletter: {
    title: 'Weekly newsletter',
    what: 'A weekly email with the sermon recap, upcoming events and announcements, written for you and sent to your list.',
    examples: [img('dash-email', "Healer's House: recent newsletters with opens and clicks.")],
    youCan: [
      'Keep members connected between Sundays',
      'Grow your list from website, chat and visitor forms automatically',
      'See open and click rates for every issue',
    ],
  },
  youtube: {
    title: 'YouTube titles, descriptions and thumbnails',
    what: 'Every service video gets a clear title, a helpful description with chapters, and a thumbnail, so more people find and click your messages.',
    examples: [img('dash-week', 'The Sunday livestream is part of each week\'s content plan.')],
    youCan: [
      'Help people find your sermons through YouTube and Google search',
      'Keep your channel looking consistent and professional',
    ],
  },
  'church-website': {
    title: 'Church website, built, hosted and maintained',
    what: 'A fast, modern website made for phones, built for you and hosted by TrueLink. Hosting, security and up to 2 small updates a month (text, photos, events) are included.',
    examples: [
      img('site-this-week', "healershouse.org: this week's services, always current."),
      img('site-campuses', 'Both campuses with addresses, times and directions.'),
      img('dash-website', 'Website numbers in your dashboard: visitors, top pages and how people found you.'),
    ],
    youCan: [
      'Give visitors everything they need in one tap: times, directions, what to expect',
      'Send us small updates (text, photos, events), up to 2 a month',
      'See how many people visit and which pages they use',
    ],
  },
  training: {
    title: '2 hours of team training',
    what: 'Up to 2 hours of live training (in person or video) for you and your team on the dashboard, approving content and using your new tools.',
    mock: 'training',
    youCan: [
      'Get your staff or volunteers comfortable in one or two short sessions',
      'Record the session so new team members can watch it later',
    ],
  },
  'quarterly-call': {
    title: 'Quarterly strategy call',
    what: 'Every three months we review your numbers together and plan the next season: events, campaigns and what to improve.',
    mock: 'call',
    youCan: ['Plan ahead for Easter, Christmas, outreach and launches', 'Ask questions and adjust your plan'],
  },
  'more-content': {
    title: 'More content, more platforms',
    what: 'Legacy roughly doubles the weekly content: 4 sermon clips and 5 graphic posts every week, across Facebook, Instagram and YouTube Shorts, plus Instagram stories.',
    examples: [img('dash-content', "Healer's House: a week of posts made from one sermon.")],
    youCan: [
      'Show up every single day without anyone on staff doing it',
      'Reach younger people on Shorts and stories',
    ],
  },
  'sermon-blog': {
    title: 'Weekly sermon blog post',
    what: 'Each message becomes a written article on your website, which helps people find you on Google and gives readers a way to go deeper.',
    examples: [img('site-this-week', 'Published on your website alongside your events and services.')],
    youCan: ['Build a searchable library of your teaching', 'Bring in new visitors from Google'],
  },
  livestream: {
    title: 'Livestream setup and support',
    what: 'We set up and support your livestream (OBS, ProPresenter, Restream) so Sunday goes out to YouTube, Facebook and your website reliably.',
    examples: [img('site-this-week', "Healer's House: Sunday service is livestreamed to YouTube and Facebook.")],
    youCan: [
      'Go live to several platforms at once from one setup',
      'Get help when something breaks before or during service',
      'Have the recording feed straight into your weekly content',
    ],
  },
  'custom-agents': {
    title: 'Custom AI agents',
    what: 'AI helpers built around the jobs that eat your week, like a church knowledge assistant or healing room appointment scheduling, monitored and improved by us every month.',
    examples: [img('dash-assistant', "Healer's House: four helpers, including Healing Rooms scheduling coming next.")],
    youCan: [
      'Hand off repetitive work like scheduling, intake and answering questions',
      'See what each helper did this month',
      'Always keep a person in charge of anything sensitive',
    ],
  },
  giving: {
    title: 'Online giving and giving goals',
    what: 'We set up online giving on your website and track special giving goals, like a turkey drive or building fund, in your dashboard.',
    examples: [
      img('site-give', "Healer's House: the Give page."),
      img('dash-event', 'A giving goal with progress and recent gifts.'),
    ],
    youCan: [
      'Make it easy to give from any phone',
      'Show progress toward a goal and share a giving link',
      'Record in-person gifts so the total stays accurate',
    ],
  },
  'events-hub': {
    title: 'Events, volunteers and team messaging',
    what: 'One calendar for every service and event, with leaders, volunteer sign-ups and team chat built in, so you are not juggling group texts.',
    examples: [
      img('dash-calendar', "Healer's House: November's services and special events."),
      img('dash-messages', 'Team channels like #ushers and #outreach. Sample names shown.'),
    ],
    youCan: [
      'Plan events with leaders, volunteers and reminders in one place',
      'Message a whole team at once with @mentions',
      'See which events still need helpers',
    ],
  },
  'website-management': {
    title: 'Full website management',
    what: 'We run your website for you. Send changes any time and we make them, batched weekly. Bigger projects like new sections are planned on your monthly call.',
    examples: [
      img('site-events', 'healershouse.org: events kept current every week.'),
      img('dash-website', 'Website numbers in your dashboard.'),
    ],
    youCan: [
      'Email or message us changes instead of logging in to edit',
      'Keep events, sermons and announcements current every week',
    ],
  },
  'branded-dashboard': {
    title: 'Your own branded dashboard',
    what: "A dashboard with your church's name and colors for your whole team: content approval, calendar, messages, email list, website numbers, AI helpers and billing.",
    examples: [img('dash-home', "The Healer's House dashboard.")],
    youCan: [
      'Give staff and key volunteers their own logins',
      'See your ministry\'s reach on one page',
      'Approve content, plan events and message teams in one place',
    ],
  },
  'monthly-call': {
    title: 'Monthly strategy call (1 hour)',
    what: 'A one-hour call every month to review results, plan what is next and decide on bigger changes.',
    mock: 'call',
    youCan: ['Plan seasons and campaigns with us', 'Prioritize the next improvements'],
  },
  'priority-support': {
    title: 'Priority support',
    what: 'Your requests go to the front of the line, with same-business-day replies. We run things for you, so you do not need to call for help day to day.',
    mock: 'support',
    youCan: ['Get faster answers when something needs attention', 'Hand off requests instead of doing them yourself'],
  },

  // ----- Business -----
  'missed-call': {
    title: 'Missed-call text-back',
    what: 'When you miss a call, the caller gets a friendly text within seconds so they wait for you instead of calling the next business.',
    mock: 'missed-call',
    youCan: [
      'Win back callers you would have lost to voicemail',
      'Reply from your phone and keep the whole conversation in one place',
      'Choose the message and your business hours',
    ],
  },
  'biz-chat-assistant': {
    title: 'Website chat assistant',
    what: 'An assistant on your website, trained on your services, prices and FAQs, that answers questions and collects contact details 24/7.',
    examples: [img('dash-assistant', "Shown: the assistant we built for Healer's House Family Church.")],
    youCan: [
      'Answer common questions instantly, day or night',
      'Capture name, phone and email from every interested visitor',
      'See which questions come up most',
    ],
  },
  'lead-followup': {
    title: 'Instant lead follow-up',
    what: 'Every form, chat and call gets an instant reply by text and email, then a short follow-up series until they book.',
    examples: [img('dash-email', 'Shown: new sign-ups and where each one came from (church example).')],
    youCan: ['Reply to every lead in seconds, not hours', 'See every lead and where it came from', 'Stop leads from going cold'],
  },
  'appointment-reminders': {
    title: 'Appointment reminders',
    what: 'Automatic text and email reminders before appointments with easy confirm and reschedule links.',
    examples: [img('dash-calendar', 'Shown: the calendar view (church example).')],
    youCan: ['Cut no-shows', 'Let customers confirm or reschedule themselves'],
  },
  reviews: {
    title: 'Google review requests',
    what: 'After each job or visit, happy customers get a short text asking for a Google review with a direct link.',
    mock: 'review',
    youCan: ['Grow your Google rating on autopilot', 'Catch unhappy customers privately before they post'],
  },
  'biz-dashboard': {
    title: 'TrueLink dashboard and monthly report',
    what: 'Your login to the TrueLink dashboard with plan, billing, leads and basic numbers, plus a plain-English monthly report.',
    examples: [img('dash-home', 'Shown: a Legacy dashboard (church example).')],
    youCan: ['See leads, calls answered and website traffic', 'Update your business profile and billing', 'Upgrade, change or cancel any time'],
  },
  'phone-receptionist': {
    title: '24/7 AI phone receptionist',
    what: 'A natural-sounding phone assistant that answers when you cannot, answers common questions and books appointments on your calendar.',
    mock: 'phone',
    youCan: ['Answer every call, even after hours', 'Book appointments while you work', 'Get a summary text after every call'],
  },
  'biz-social': {
    title: 'Social media management',
    what: '16 posts a month on 2 platforms, including 4 short videos, written, designed and scheduled for you.',
    examples: [img('dash-content', 'Shown: a week of posts ready for approval (church example).')],
    youCan: ['Approve the week in one click, or let it run', 'See what each post reached'],
  },
  'biz-newsletter': {
    title: 'Monthly newsletter and follow-up emails',
    what: 'A monthly email to your customer list plus automatic follow-up sequences for new leads and past customers.',
    examples: [img('dash-email', 'Shown: list growth and newsletter results (church example).')],
    youCan: ['Bring past customers back', 'Track opens and clicks'],
  },
  'biz-website': {
    title: '5-page website, built, hosted and maintained',
    what: 'A modern, phone-friendly website built for you and hosted by TrueLink, with chat and booking built in. Up to 2 small updates a month are included.',
    examples: [
      img('site-this-week', "Shown: healershouse.org, a site we built and host."),
      img('dash-website', 'Website numbers in your dashboard.'),
    ],
    youCan: ['Look professional on every phone', 'Send us small updates, up to 2 a month', 'See visitors and how they found you'],
  },
  'biz-agents': {
    title: '2 to 4 custom AI agents',
    what: 'AI helpers built around your workflows, such as quoting, intake, scheduling or reporting, monitored and improved every month.',
    examples: [img('dash-assistant', 'Shown: AI helpers and what they did this month (church example).')],
    youCan: ['Hand off the jobs that eat your week', 'See what each agent did', 'Keep a person in charge of anything sensitive'],
  },
  'biz-social-plus': {
    title: 'Social media on 3 platforms with short videos',
    what: '5 posts a week across 3 platforms, including 8 short videos a month, plus weekly Google Business Profile posts.',
    examples: [img('dash-week', 'Shown: the weekly schedule and results (church example).')],
    youCan: ['Show up every day without lifting a finger', 'Rank better in local Google results'],
  },
  'biz-website-management': {
    title: 'Full website management',
    what: 'We run your website. Send changes any time and we make them, batched weekly.',
    examples: [img('dash-website', 'Website numbers in your dashboard.')],
    youCan: ['Request changes by email or message', 'Keep offers and info current'],
  },
};

// ---------------------------------------------------------------------------
// Plans. `items` reference SERVICES by id; `label` is the text on the card.
// ---------------------------------------------------------------------------
export const PLANS = {
  church: [
    {
      id: 'seed',
      name: 'Seed',
      promise: 'No visitor or prayer request falls through the cracks',
      monthly: 197,
      items: [
        ['chat-assistant', '24/7 website chat assistant'],
        ['guest-followup', 'First-time guest follow-up by text and email'],
        ['prayer-requests', 'Prayer request intake and routing'],
        ['reminders', 'Event and volunteer reminders'],
        ['announcements-email', 'Weekly announcements email'],
        ['invite-graphic', 'Weekly "Join us Sunday" graphic'],
        ['portal-report', 'TrueLink dashboard and monthly report'],
      ],
    },
    {
      id: 'harvest',
      name: 'Harvest',
      promise: "Sunday's message reaches people all week",
      monthly: 497,
      popular: true,
      everything: 'Seed',
      items: [
        ['sermon-content', 'Sermon-to-content: 2 clips + 3 graphic posts every week'],
        ['social-scheduling', 'Facebook and Instagram posting'],
        ['sermon-notes', 'Sermon notes and discussion questions'],
        ['newsletter', 'Weekly newsletter with sermon recap'],
        ['youtube', 'YouTube titles, descriptions and thumbnails'],
        ['church-website', 'Church website, built, hosted and maintained'],
        ['training', '2 hours of team training'],
        ['quarterly-call', 'Quarterly strategy call'],
      ],
    },
    {
      id: 'legacy',
      name: 'Legacy',
      promise: 'A full tech team, without the payroll',
      monthly: 997,
      startsAt: true,
      everything: 'Harvest',
      items: [
        ['more-content', '4 clips + 5 graphic posts a week, plus Shorts and stories'],
        ['sermon-blog', 'Weekly sermon blog post'],
        ['livestream', 'Livestream setup and support'],
        ['custom-agents', 'Custom AI agents (knowledge assistant, scheduling)'],
        ['giving', 'Online giving and giving goals'],
        ['events-hub', 'Events, volunteers and team messaging'],
        ['website-management', 'Full website management'],
        ['branded-dashboard', 'Your own church-branded dashboard'],
        ['monthly-call', 'Monthly 1-hour strategy call'],
        ['priority-support', 'Priority support'],
      ],
    },
  ],
  business: [
    {
      id: 'essentials',
      name: 'Essentials',
      promise: 'Never lose another lead',
      monthly: 297,
      items: [
        ['missed-call', 'Missed-call text-back'],
        ['biz-chat-assistant', 'Website chat assistant trained on your FAQs'],
        ['lead-followup', 'Instant lead follow-up by text and email'],
        ['appointment-reminders', 'Appointment reminders'],
        ['reviews', 'Google review requests'],
        ['biz-dashboard', 'TrueLink dashboard and monthly report'],
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      promise: 'Your front office runs itself',
      monthly: 697,
      popular: true,
      everything: 'Essentials',
      items: [
        ['phone-receptionist', '24/7 AI phone receptionist that books appointments'],
        ['biz-social', 'Social media: 16 posts a month on 2 platforms'],
        ['biz-newsletter', 'Monthly newsletter and follow-up emails'],
        ['biz-website', '5-page website, built, hosted and maintained'],
        ['training', '2 hours of team training'],
        ['quarterly-call', 'Quarterly strategy call'],
      ],
    },
    {
      id: 'partner',
      name: 'Partner',
      promise: 'Your own AI team, managed for you',
      monthly: 1497,
      startsAt: true,
      everything: 'Growth',
      items: [
        ['biz-agents', '2 to 4 custom AI agents built around your workflows'],
        ['biz-social-plus', 'Social media on 3 platforms with short videos'],
        ['biz-website-management', 'Full website management'],
        ['branded-dashboard', 'Your own branded dashboard'],
        ['monthly-call', 'Monthly 1-hour strategy call'],
        ['priority-support', 'Priority support'],
      ],
    },
  ],
};

// Rows for the "Compare plans" table. Values: true, false, or a short string.
export const COMPARE = {
  church: [
    ['Website chat assistant', true, true, true],
    ['Guest follow-up and prayer request routing', true, true, true],
    ['Event and volunteer reminders', true, true, true],
    ['Weekly email', 'Announcements', 'Newsletter + sermon recap', 'Newsletter + sermon recap'],
    ['Social posts per week', '1 graphic', '5 (2 clips + 3 graphics)', '9 (4 clips + 5 graphics) + stories'],
    ['Platforms', 'Facebook, Instagram', 'Facebook, Instagram', 'Facebook, Instagram, YouTube Shorts'],
    ['Sermon notes and YouTube details', false, true, true],
    ['Weekly sermon blog post', false, false, true],
    ['Church website, hosted', false, true, true],
    ['Website updates', false, 'Up to 2 small updates a month', 'We run it for you'],
    ['Livestream setup and support', false, false, true],
    ['Custom AI agents', false, false, true],
    ['Online giving and giving goals', false, false, true],
    ['Dashboard', 'TrueLink', 'TrueLink', 'Your own branded dashboard'],
    ['Training', false, '2 hours', 'Ongoing, we run it'],
    ['Strategy calls', false, 'Quarterly', 'Monthly (1 hour)'],
    ['Support replies', '1 business day', '1 business day', 'Same business day (priority)'],
  ],
  business: [
    ['Missed-call text-back', true, true, true],
    ['Website chat assistant', true, true, true],
    ['Lead follow-up, reminders, review requests', true, true, true],
    ['AI phone receptionist', false, true, true],
    ['Social posts per month', false, '16 on 2 platforms (4 videos)', '20+ on 3 platforms (8 videos)'],
    ['Google Business Profile posts', false, false, 'Weekly'],
    ['Newsletter and follow-up emails', false, 'Monthly', 'Monthly'],
    ['Website, hosted', false, '5 pages', '5+ pages'],
    ['Website updates', false, 'Up to 2 small updates a month', 'We run it for you'],
    ['Custom AI agents', false, false, '2 to 4'],
    ['Dashboard', 'TrueLink', 'TrueLink', 'Your own branded dashboard'],
    ['Training', false, '2 hours', 'Ongoing, we run it'],
    ['Strategy calls', false, 'Quarterly', 'Monthly (1 hour)'],
    ['Support replies', '1 business day', '1 business day', 'Same business day (priority)'],
  ],
};

export const EVERY_PLAN = [
  'No setup or build fees',
  'Month to month, cancel anytime',
  'Approve everything first, or run on autopilot',
  'Hosting and tools included',
  'Your content and contacts stay yours',
  'Upgrade or change plans any time',
];
