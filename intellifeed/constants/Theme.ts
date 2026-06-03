// ─── Theme — "Noir" ──────────────────────────────────────────────────────────
// A dark, members'-club aesthetic: near-black surfaces, ivory text, a single
// crimson accent + a champagne gold for trending/featured sparkle. Display type
// is Space Grotesk; body is Inter; meta is Space Mono.
//
// Token NAMES are kept stable so the ~26 screens that read them re-skin to dark
// automatically; new Noir-specific keys (gold, primarySoft, border, …) are added.

import type { TextStyle } from 'react-native';

export const Colors = {
  // Surfaces
  background: '#0A090B',          // appBg — screen background (near-black)
  appBgTop: '#100E12',            // gradient top of background
  backgroundDeep: '#100E12',      // (legacy alias) deeper bg
  surface: '#161319',             // card background
  surfaceElevated: '#1C1922',     // raised card
  surfaceAlt: '#201C24',          // inset / secondary surface
  surfaceMuted: '#201C24',        // (legacy alias)
  border: 'rgba(244,241,236,0.08)',
  borderStrong: 'rgba(244,241,236,0.16)',
  surfaceBorder: 'rgba(244,241,236,0.08)',        // (legacy alias) → border
  surfaceBorderStrong: 'rgba(244,241,236,0.16)',  // (legacy alias) → borderStrong

  // Text — ivory on near-black
  textPrimary: '#F4F1EC',
  textSecondary: 'rgba(244,241,236,0.66)',
  textMuted: 'rgba(244,241,236,0.44)',
  textFaint: 'rgba(244,241,236,0.28)',

  // Primary — crimson
  primary: '#E5484D',
  primaryDark: '#C42B30',
  primarySoft: 'rgba(229,72,77,0.13)',
  primarySoftStrong: 'rgba(229,72,77,0.22)',
  primaryGlow: 'rgba(229,72,77,0.13)',        // (legacy alias) → primarySoft
  primaryGlowStrong: 'rgba(229,72,77,0.22)',  // (legacy alias) → primarySoftStrong
  onPrimary: '#FFFFFF',

  // Champagne gold — trending / featured accents
  gold: '#CDA86A',
  hairlineGold: 'rgba(205,168,106,0.32)',

  // Secondary accents
  accentSage: '#5FB89A',
  accentOchre: '#E0A75E',
  accentBurgundy: '#E36A82',

  // Functional
  success: '#3DD68C',
  warning: '#E0A75E',
  danger: '#E5484D',

  // Category tags — vivid tints used over imagery
  tagSport: '#EF4444',
  tagScience: '#3B82F6',
  tagAI: '#8B5CF6',
  tagPsych: '#10B981',
  tagHistory: '#B45309',
  tagBusiness: '#6366F1',
  tagHealth: '#10B981',
  tagPhilosophy: '#A78BFA',

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
  // Display — Space Grotesk (wordmark, titles, card headlines)
  display: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  displayBold: 'SpaceGrotesk_700Bold',

  // Body — Inter
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',

  // Meta — Space Mono
  mono: 'SpaceMono_400Regular',
  monoMedium: 'SpaceMono_700Bold',

  // ── Legacy aliases — repointed to Space Grotesk so the wordmark and any
  //    inline `brand`/`serif` usages adopt the Noir display face automatically.
  brand: 'SpaceGrotesk_600SemiBold',
  brandItalic: 'SpaceGrotesk_500Medium',
  serif: 'SpaceGrotesk_600SemiBold',
  serifRegular: 'SpaceGrotesk_400Regular',
  serifSemibold: 'SpaceGrotesk_600SemiBold',
  serifItalic: 'SpaceGrotesk_400Regular',
  serifItalicMedium: 'SpaceGrotesk_500Medium',
};

// ─── Typography Tokens ──────────────────────────────────────────────────────
// One token per role. Hierarchy is built from size + weight + spacing +
// color — bold is used sparingly. Line heights are generous (1.4-1.5 for
// body) to match a comfortable scrolling feed.

export const TextStyles: Record<string, TextStyle> = {
  // ── BRAND / DISPLAY (Space Grotesk) ─────────────────────────────────────
  appTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  brandHero: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },

  // ── PRODUCT TITLES (Space Grotesk) ──────────────────────────────────────
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },

  // Feed-card titles + small editorial cards
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  cardTitleSmall: {
    fontFamily: Fonts.display,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },

  // Aliases that match the requested token names exactly
  feedTitle: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  articleTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 32,
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
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  overline: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10.5,
    letterSpacing: 1.4,
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
    color: Colors.onPrimary,
  },
  buttonPrimary: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    letterSpacing: 0.1,
    color: Colors.onPrimary,
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
  lg: 16,
  xl: 18,
  card: 20,
  xxl: 24,
  full: 999,
};

// Shadows — deep & dark for the Noir surfaces.
export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 16,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 14,
  },
  // Crimson "glow" for lead/featured cards.
  glow: {
    shadowColor: '#E5484D',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 16,
  },
};
