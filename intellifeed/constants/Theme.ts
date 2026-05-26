// ─── The Modern Thinker Theme ───────────────────────────────────────────────
// A premium, intellectual palette balancing clarity and depth.

export const Colors = {
  // Core surfaces
  background: '#F8F9FA',          // Clean cream/ivory — global canvas
  surface: '#FFFFFF',             // Pure white — cards and containers
  surfaceElevated: '#FFFFFF',     // Identical surface tone (light theme)
  surfaceBorder: '#E2E8F0',       // Light gray-blue — subtle dividers
  surfaceMuted: '#F1F5F9',        // Faintly tinted neutral

  // Text — deep navy avoids the harshness of pure black
  textPrimary: '#0F172A',         // Deep Navy / Slate Black — headings & body
  textSecondary: '#475569',       // Slate Gray — subtitles & descriptions
  textMuted: '#64748B',           // Muted Slate — metadata & secondary accent

  // Primary accent — Deep Steel Blue (buttons, active states, key links)
  primary: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',         // Hover / pressed state
  primaryGlow: '#1D4ED81A',       // Translucent blue overlay (~10%)

  // Functional accents
  accent: '#1D4ED8',
  accentGreen: '#059669',         // Success / progress signals
  accentOrange: '#D97706',        // Subtle highlight
  accentBlue: '#64748B',          // Muted slate — secondary accent

  // Category tags — saturated yet refined; readable on white
  tagSport: '#B91C1C',            // Crimson
  tagScience: '#0E7490',          // Teal
  tagAI: '#1E40AF',               // Deep Blue
  tagPsych: '#15803D',            // Forest Green
  tagHistory: '#A16207',          // Amber Brown
  tagBusiness: '#7C3AED',         // Royal Purple
  tagHealth: '#059669',           // Emerald
  tagPhilosophy: '#B45309',       // Warm Ochre

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// ─── Font Families ───────────────────────────────────────────────────────────
// Playfair Display — Headings, quotes, logo (Serif)
// Inter — Body text, UI elements (Sans-Serif)

export const Fonts = {
  serif: 'PlayfairDisplay_700Bold',
  serifRegular: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
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

// Soft, delicate shadows — gently lift surfaces off the cream canvas
export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};
