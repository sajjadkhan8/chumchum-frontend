export interface CategoryOption {
  value: string;
  label: string;
}

export const categoryOptions: CategoryOption[] = [
  { value: 'FOOD', label: 'Food' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'BEAUTY', label: 'Beauty' },
  { value: 'TECH', label: 'Tech' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'LIFESTYLE', label: 'Lifestyle' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'BUSINESS_FINANCE', label: 'Business & Finance' },
  { value: 'HOME_DECOR', label: 'Home & Decor' },
  { value: 'PARENTING_FAMILY', label: 'Parenting & Family' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'RELIGIOUS_SPIRITUAL', label: 'Religious & Spiritual' },
  { value: 'GENERAL', label: 'General' },
];

export const categoryValues = categoryOptions.map((option) => option.value);
export const barterTypeOptions = categoryOptions;
export const barterTypeValues = categoryValues;

const categoryLabelByValue = new Map(categoryOptions.map((option) => [option.value, option.label]));

const legacyCategoryAliases: Record<string, string> = {
  FASHION_BEAUTY: 'FASHION',
  FOOD_BEVERAGE: 'FOOD',
  TECHNOLOGY_GADGETS: 'TECH',
  FITNESS_HEALTH: 'FITNESS',
  TRAVEL_LIFESTYLE: 'TRAVEL',
  ENTERTAINMENT_COMEDY: 'ENTERTAINMENT',
  EDUCATION_CAREER: 'EDUCATION',
  TECHNOLOGY: 'TECH',
  COMEDY: 'ENTERTAINMENT',
  COOKING: 'FOOD',
  VLOGGING: 'LIFESTYLE',
  REVIEWS: 'TECH',
  PARENTING: 'PARENTING_FAMILY',
  FAMILY: 'PARENTING_FAMILY',
  WELLNESS: 'HEALTH',
  EVENTS: 'ENTERTAINMENT',
  BUSINESS: 'BUSINESS_FINANCE',
  FINANCE: 'BUSINESS_FINANCE',
  REAL_ESTATE: 'BUSINESS_FINANCE',
  HOTEL: 'TRAVEL',
  HOTELS: 'TRAVEL',
  STAYS: 'TRAVEL',
  SALON: 'BEAUTY',
  SPA: 'BEAUTY',
  EVENTS_TICKETS: 'ENTERTAINMENT',
  PRODUCTS: 'GENERAL',
  SERVICES: 'GENERAL',
};

export function normalizeCategory(value: string | null | undefined): string {
  if (!value) return '';

  const normalized = value
    .trim()
    .replace(/&/g, ' ')
    .replace(/[-\s]+/g, '_')
    .toUpperCase();

  const canonical = legacyCategoryAliases[normalized] || normalized;
  return categoryLabelByValue.has(canonical) ? canonical : '';
}

export function normalizeCategories(values: Array<string | null | undefined> | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values?.forEach((value) => {
    const normalized = normalizeCategory(value);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  });

  return result;
}

export function getCategoryLabel(value: string | null | undefined): string {
  const normalized = normalizeCategory(value);
  if (!normalized) return value?.trim() || 'General';
  return categoryLabelByValue.get(normalized) || normalized;
}

export const normalizeBarterTypes = normalizeCategories;
export const getBarterTypeLabel = getCategoryLabel;

export function sortCategoryOptionsForProfile(profileCategories: string[]): CategoryOption[] {
  const selected = new Set(normalizeCategories(profileCategories));
  return [
    ...categoryOptions.filter((option) => selected.has(option.value)),
    ...categoryOptions.filter((option) => !selected.has(option.value)),
  ];
}
