// Available interest domains — referenced by onboarding, profile, and feed personalization.
export const INTEREST_OPTIONS = [
  'Science',
  'AI',
  'Philosophy',
  'Performance',
  'Geopolitics',
  'Business',
  'Health',
  'Psychology',
  'Longevity',
  'Literature',
  'Economics',
  'History',
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number];
