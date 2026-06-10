// ─── Product copy ────────────────────────────────────────────────────────────
// Single source of truth for product positioning, so the name and the core
// message read identically everywhere they appear (auth, onboarding, profile).
//
// Positioning: Sapience is a social reading and daily-briefing app for people
// who want to upgrade their cognitive diet. Keep copy concise and premium —
// state the idea, don't explain it.

export const Product = {
  /** The product name. Always "Sapience" — never "Sapiens" or "IntelliFeed". */
  name: 'Sapience',

  /** Primary tagline. The one line that should appear wherever we set the tone. */
  tagline: 'Upgrade your cognitive diet.',

  /** Supporting line — the promise, in five words. */
  promise: 'Read better ideas, not more content.',

  /** One-sentence description of what the product is. */
  description:
    'Daily briefings and curated reading clubs for people who take their mind seriously.',

  /** Shorter blurb for tight spaces (onboarding lede, etc.). */
  blurb: 'Daily briefings and curated reading clubs — not an endless scroll.',
} as const;

// ─── Beta-honest social copy ─────────────────────────────────────────────────
// Used in place of fabricated traction (member counts, "% active") while we're
// in private beta. These are true statements: every club really is a founding
// circle, and testers really are among the first readers.
export const Beta = {
  foundingCircle: 'Founding circle',
  earlyClub: 'Early beta club',
  beFirst: 'Be among the first readers',
  newClub: 'New club',
} as const;
