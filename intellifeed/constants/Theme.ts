// ─── The Atelier Theme ───────────────────────────────────────────────────────
// Editorial luxury. Warm cream paper, terracotta accent, deep ink.
// Newsreader (serif) for reading and headlines · Manrope (sans) for UI
// metadata · Geist Mono for kickers and overlines.

import type { TextStyle } from 'react-native';

export const Colors = {
  // Surfaces — layered cream tones
  background: '#F4EDE0',           // warm cream paper
  backgroundDeep: '#ECE4D3',       // shadowed paper
  surface: '#FAF6EC',              // raised paper (cards)
  surfaceElevated: '#FFFFFF',      // crispest paper (modals)
  surfaceMuted: '#EDE5D0',         // muted overlay
  surfaceBorder: 'rgba(45,36,24,0.08)',
  surfaceBorderStrong: 'rgba(45,36,24,0.18)',

  // Text — warm ink hierarchy
  textPrimary: '#241C12',          // deep ink
  textSecondary: '#3D3326',        // body
  textMuted: '#6B5D4C',            // captions, metadata
  textFaint: '#A89070',            // faintest

  // Primary — terracotta (signature accent)
  primary: '#7C5234',
  primaryDark: '#5E3E27',          // hover / pressed
  primaryGlow: 'rgba(124,82,52,0.08)',
  primaryGlowStrong: 'rgba(124,82,52,0.16)',

  // Secondary accents
  accentSage: '#4F6346',           // sage green
  accentOchre: '#8A6B2E',          // warm ochre
  accentBurgundy: '#A05A4E',       // muted burgundy

  // Functional
  success: '#4F6346',
  warning: '#8A6B2E',
  danger: '#A04638',

  // Category tags — restrained earth tones harmonizing with terracotta
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
export const Fonts = {
  // Newsreader — editorial body + headings
  serif: 'Newsreader_500Medium',
  serifRegular: 'Newsreader_400Regular',
  serifSemibold: 'Newsreader_600SemiBold',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifItalicMedium: 'Newsreader_500Medium_Italic',
  // Manrope — UI text
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemibold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  // Geist Mono — kicker / overline / numerical metadata
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
};

// ─── Typography System ──────────────────────────────────────────────────────
// Hierarchy through family + size + spacing + color. Atelier uses Newsreader
// for editorial moments AND body reading; Manrope for UI/metadata; Geist
// Mono for kickers (uppercase typographic labels).

export const TextStyles: Record<string, TextStyle> = {
  // ── EDITORIAL (Newsreader) ───────────────────────────────────────────────
  appTitle: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
  },
  screenTitle: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: Colors.textPrimary,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  cardTitleSmall: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  displayNumber: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -1,
    color: Colors.textPrimary,
  },
  tagline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textMuted,
  },

  // Body reading (serif, like an article)
  body: {
    fontFamily: Fonts.serifRegular,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textSecondary,
  },
  bodySecondary: {
    fontFamily: Fonts.serifRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textMuted,
  },

  // ── UI / READABILITY (Manrope) ───────────────────────────────────────────
  helper: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
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
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
  },

  // ── KICKERS / OVERLINES (Geist Mono) ─────────────────────────────────────
  kicker: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  overline: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.textFaint,
  },

  // ── Forms ─────────────────────────────────────────────────────────────────
  inputLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: Colors.textPrimary,
  },
  inputValue: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputHelper: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
  },
  error: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.danger,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  buttonPrimary: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.surface,
  },
  buttonSecondary: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  buttonGhost: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.primary,
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textFaint,
  },
  tabLabelActive: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.primary,
  },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyDescription: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textMuted,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statNumber: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  statNumberLarge: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textFaint,
  },

  // ── Tags / pills (Geist Mono uppercase) ──────────────────────────────────
  tag: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
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

// Soft, warm shadows — barely there. Atelier relies on tonal contrast more than depth.
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
