// Editorial glyphs, colors, and gradients per domain.
// Used on feed cards, category pills, and detail headers.

export type CategoryStyle = {
  glyph: string;
  color: string;
  background: string;
  // Gradient pair for card overlay [top, bottom]
  gradientStart: string;
  gradientEnd: string;
};

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Science:     { glyph: '⚛',  color: '#0E7490', background: '#0E749015', gradientStart: '#1E3A5F', gradientEnd: '#2563EB' },
  AI:          { glyph: '◈',  color: '#1E40AF', background: '#1E40AF15', gradientStart: '#2E1065', gradientEnd: '#7C3AED' },
  Business:    { glyph: '◆',  color: '#7C3AED', background: '#7C3AED15', gradientStart: '#1E1B4B', gradientEnd: '#4338CA' },
  Performance: { glyph: '⚡',  color: '#B91C1C', background: '#B91C1C15', gradientStart: '#450A0A', gradientEnd: '#DC2626' },
  Philosophy:  { glyph: '☉',  color: '#B45309', background: '#B4530915', gradientStart: '#431407', gradientEnd: '#C2410C' },
  Geopolitics: { glyph: '◍',  color: '#15803D', background: '#15803D15', gradientStart: '#052E16', gradientEnd: '#16A34A' },
  Health:      { glyph: '✚',  color: '#059669', background: '#05966915', gradientStart: '#022C22', gradientEnd: '#059669' },
  Psychology:  { glyph: '◐',  color: '#A16207', background: '#A1620715', gradientStart: '#1C1917', gradientEnd: '#92400E' },
  Longevity:   { glyph: '∞',  color: '#059669', background: '#05966915', gradientStart: '#022C22', gradientEnd: '#0D9488' },
  Literature:  { glyph: '❦',  color: '#7C3AED', background: '#7C3AED15', gradientStart: '#1E1033', gradientEnd: '#9333EA' },
  Economics:   { glyph: '⌃',  color: '#0E7490', background: '#0E749015', gradientStart: '#082F49', gradientEnd: '#0369A1' },
  History:     { glyph: '◊',  color: '#A16207', background: '#A1620715', gradientStart: '#1C0A00', gradientEnd: '#B45309' },
};

const DEFAULT_STYLE: CategoryStyle = {
  glyph: '◆',
  color: '#1D4ED8',
  background: '#1D4ED815',
  gradientStart: '#1E3A5F',
  gradientEnd: '#2563EB',
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}
