// ─── Theme ───────────────────────────────────────────────────────────────────
// Color palette: the existing Modern Thinker tones (warm paper background,
// terracotta accent, deep ink — unchanged).
//
// Typography: Inter is the primary family across the whole product.
// Playfair Display is reserved for the brand mark (the "Sapience" logo) and
// the occasional editorial hero — it is intentionally rare. The intent is a
// clean, modern social/product feel (LinkedIn / Facebook readability), not an
// editorial magazine.

import type { TextStyle } from 'react-native';

export const Colors = {
  // Surfaces — clean white canvas with warm cream cards floating on it.
  // The cards (surface) keep the Atelier warmth so the content blocks read
  // as a different material from the page itself.
  background: '#FFFFFF',
  backgroundDeep: '#F8F5EE',
  surface: '#F4EDE0',
  surfaceElevated: '#FAF6EC',
  surfaceMuted: '#EDE5D0',
  surfaceBorder: 'rgba(45,36,24,0.10)',
  surfaceBorderStrong: 'rgba(45,36,24,0.20)',

  // Text
  textPrimary: '#241C12',
  textSecondary: '#3D3326',
  textMuted: '#6B5D4C',
  textFaint: '#A89070',

  // Primary — terracotta
  primary: '#7C5234',
  primaryDark: '#5E3E27',
  primaryGlow: 'rgba(124,82,52,0.08)',
  primaryGlowStrong: 'rgba(124,82,52,0.16)',

  // Secondary accents
  accentSage: '#4F6346',
  accentOchre: '#8A6B2E',
  accentBurgundy: '#A05A4E',

  // Functional
  success: '#4F6346',
  warning: '#8A6B2E',
  danger: '#A04638',

  // Category tags — restrained earth tones
  tagSport: '#A04638',
  tagScience: '#4F6346',
  tagAI: '#5C6A82',
  tagPsych: '#4F6346',
  tagHistory: '#8A6B2E',
  tagBusiness: '#7C5234',
  tagHealth: '#4F6346',
  tagPhilosophy: '#8A6B2E',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// ─── Font Families ──────────────────────────────────────────────────────────
// `sans*` → Inter, used everywhere.
// `brand`/`brandItalic` → Playfair Display, used only by appTitle (the
//   "Sapience" logo) and the rare hero brand moment.
// The serif/mono aliases keep legacy inline `fontFamily: Fonts.serif` usages
// alive without surprise — they map to Inter equivalents so we get a
// uniform product look without touching every screen.
export const Fonts = {
  // Primary — Inter
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',

  // Brand — Playfair Display (rare)
  brand: 'PlayfairDisplay_700Bold',
  brandItalic: 'PlayfairDisplay_400Regular_Italic',

  // ── Legacy aliases — point to Inter so existing inline usages get the
  //    new product feel without per-file edits.
  serif: 'Inter_700Bold',
  serifRegular: 'Inter_400Regular',
  serifSemibold: 'Inter_600SemiBold',
  serifItalic: 'Inter_400Regular',
  serifItalicMedium: 'Inter_500Medium',
  mono: 'Inter_500Medium',
  monoMedium: 'Inter_600SemiBold',
};

// ─── Typography Tokens ──────────────────────────────────────────────────────
// One token per role. Hierarchy is built from size + weight + spacing +
// color — bold is used sparingly. Line heights are generous (1.4-1.5 for
// body) to match a comfortable scrolling feed.

export const TextStyles: Record<string, TextStyle> = {
  // ── BRAND (Playfair Display — rare) ─────────────────────────────────────
  appTitle: {
    fontFamily: Fonts.brand,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  brandHero: {
    fontFamily: Fonts.brand,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },

  // ── PRODUCT TITLES (Inter) ──────────────────────────────────────────────
  screenTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  heroTitle: {
    // Used for in-flow hero headlines (onboarding step intros, etc.) — still
    // Inter, not Playfair, so it feels product-y rather than editorial.
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: Colors.textPrimary,
  },

  // Feed-card titles + small editorial cards
  cardTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  cardTitleSmall: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.textPrimary,
  },

  // Aliases that match the requested token names exactly
  feedTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  articleTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },

  // ── BODY (Inter, generous line heights) ─────────────────────────────────
  body: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  bodySecondary: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  feedBody: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  articleBody: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  articleSummary: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },

  // Tagline / lede — quiet sans, not decorative italic
  tagline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },

  // ── METADATA & SECONDARY (Inter) ────────────────────────────────────────
  helper: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  metadata: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },

  // ── KICKER / OVERLINE (Inter, sparing letter-spacing) ──────────────────
  kicker: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 0.3,
    color: Colors.primary,
  },
  overline: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },

  // ── PROFILE-SPECIFIC ────────────────────────────────────────────────────
  profileName: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  profileBio: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  // ── EMPTY STATES ────────────────────────────────────────────────────────
  emptyTitle: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  emptyDescription: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },

  // ── STATS / NUMBERS ─────────────────────────────────────────────────────
  displayNumber: {
    fontFamily: Fonts.sansBold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  statsNumber: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  statsLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.textMuted,
  },
  // Legacy aliases for stat tokens
  statNumber: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  statNumberLarge: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.textMuted,
  },

  // ── FORMS (Inter) ───────────────────────────────────────────────────────
  inputLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 0.1,
    color: Colors.textPrimary,
  },
  inputValue: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputHelper: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.danger,
  },

  // ── BUTTONS — sentence case, restrained letter-spacing ──────────────────
  button: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    letterSpacing: 0.1,
    color: Colors.surface,
  },
  buttonPrimary: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    letterSpacing: 0.1,
    color: Colors.surface,
  },
  buttonSecondary: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    letterSpacing: 0.1,
    color: Colors.primary,
  },
  buttonGhost: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.primary,
  },

  // ── TAB BAR ─────────────────────────────────────────────────────────────
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.primary,
  },

  // ── TAGS / CATEGORY PILLS ───────────────────────────────────────────────
  tag: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.textSecondary,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  xxxl: 56,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

// Soft shadows — subtle, modern, not editorial.
export const Shadow = {
  sm: {
    shadowColor: '#241C12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#241C12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#241C12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 5,
  },
};
