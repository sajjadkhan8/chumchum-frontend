export const CAMPAIGN_GOAL_SECTIONS = [
  {
    label: '📣 Awareness & Reach',
    options: ['Brand Awareness', 'Product Launch', 'Store/Location Launch', 'App Launch', 'Rebranding', 'Market Expansion'],
  },
  {
    label: '🤳 Engagement & Community',
    options: ['Boost Engagement', "Grow Brand's Social Following", 'UGC Generation', 'Hashtag Campaign', 'Challenge/Trend Participation', 'Meme/Viral Content'],
  },
  {
    label: '🛒 Conversions & Sales',
    options: ['Drive Website Traffic', 'Product Sales', 'App Installs', 'Sign-ups / Leads', 'In-store Footfall', 'Flash Sale / Discount Promotion', 'Ramadan / Seasonal Campaign'],
  },
  {
    label: '🎓 Education & Trust',
    options: ['Product Education', 'Brand Credibility / PR', 'Myth-busting / Awareness', 'How-to / Tutorial', 'Testimonial / Review'],
  },
  {
    label: '🎯 Retention & Loyalty',
    options: ['Re-engagement Campaign', 'Loyalty Program Promotion', 'Customer Story'],
  },
  {
    label: '🤝 Partnership & Long-term',
    options: ['Brand Ambassador Search', 'Ongoing Content Partnership', 'Co-creation'],
  },
] as const;

export const CAMPAIGN_GOAL_OPTIONS = CAMPAIGN_GOAL_SECTIONS.flatMap((section) => section.options);

const CAMPAIGN_GOAL_DESCRIPTION_MAP: Record<string, string> = {
  'Brand Awareness': 'Get more people to know the brand exists',
  'Product Launch': 'Introduce a new product to the market',
  'Store/Location Launch': 'Drive awareness of a new physical outlet',
  'App Launch': 'Announce a new mobile app',
  Rebranding: 'Reintroduce the brand under a new identity',
  'Market Expansion': 'Enter a new city or demographic',
  'Boost Engagement': 'Likes, comments, shares, saves',
  "Grow Brand's Social Following": 'Drive people to follow brand accounts',
  'UGC Generation': 'Get creators to produce reusable content assets',
  'Hashtag Campaign': 'Drive a branded hashtag trend',
  'Challenge/Trend Participation': 'TikTok/Reels challenge amplification',
  'Meme/Viral Content': 'Humorous or culturally resonant content push',
  'Drive Website Traffic': 'Link in bio / swipe-up clicks',
  'Product Sales': 'Direct purchase intent (promo code, affiliate link)',
  'App Installs': 'Download conversion',
  'Sign-ups / Leads': 'Email list, waitlist, form fills',
  'In-store Footfall': 'Drive physical visits to a shop',
  'Flash Sale / Discount Promotion': 'Time-limited offer amplification',
  'Ramadan / Seasonal Campaign': 'Eid, back-to-school, summer, etc.',
  'Product Education': 'Explain how a product works (tutorials, demos)',
  'Brand Credibility / PR': 'Build trust through endorsements',
  'Myth-busting / Awareness': 'Counter misinformation about a category',
  'How-to / Tutorial': 'Step-by-step usage content',
  'Testimonial / Review': 'Honest creator opinion content',
  'Re-engagement Campaign': 'Win back lapsed customers',
  'Loyalty Program Promotion': 'Drive sign-ups to a rewards scheme',
  'Customer Story': 'Feature real customer experiences via creators',
  'Brand Ambassador Search': 'Find a long-term face for the brand',
  'Ongoing Content Partnership': 'Monthly retainer-style content deal',
  'Co-creation': 'Brand and creator build something together',
};

export function getCampaignGoalDescription(goal?: string | null): string {
  if (!goal) return '';
  return CAMPAIGN_GOAL_DESCRIPTION_MAP[goal] || '';
}

const CAMPAIGN_GOAL_STYLES = [
  {
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
    panelClassName: 'border-sky-200/70 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20',
  },
  {
    badgeClassName: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
    panelClassName: 'border-fuchsia-200/70 bg-fuchsia-50/70 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/20',
  },
  {
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    panelClassName: 'border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20',
  },
  {
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    panelClassName: 'border-amber-200/70 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20',
  },
  {
    badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300',
    panelClassName: 'border-violet-200/70 bg-violet-50/70 dark:border-violet-900/50 dark:bg-violet-950/20',
  },
  {
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    panelClassName: 'border-rose-200/70 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20',
  },
] as const;

const campaignGoalMetaByOption = new Map<string, {
  goal: string;
  sectionLabel: string;
  badgeClassName: string;
  panelClassName: string;
}>(
  CAMPAIGN_GOAL_SECTIONS.flatMap((section, index) =>
    section.options.map((option) => [
      option,
      {
        goal: option,
        sectionLabel: section.label,
        ...CAMPAIGN_GOAL_STYLES[index],
      },
    ])
  )
);

export function getCampaignGoalMeta(goal?: string | null) {
  if (!goal) return null;

  return campaignGoalMetaByOption.get(goal) ?? {
    goal,
    sectionLabel: 'Campaign Goal',
    badgeClassName: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
    panelClassName: 'border-slate-200/70 bg-slate-50/70 dark:border-slate-800/70 dark:bg-slate-900/20',
  };
}

