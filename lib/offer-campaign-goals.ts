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

