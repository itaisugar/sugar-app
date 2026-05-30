// Editorial glyphs and colors per domain. Used on feed cards, category pills,
// and detail headers so each category has a recognisable signature.

export type CategoryStyle = {
  glyph: string;       // single character, drawn large
  color: string;       // accent
  background: string;  // soft chip background
};

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Science:     { glyph: '⚛',  color: '#0E7490', background: '#0E749015' },
  AI:          { glyph: '◈',  color: '#1E40AF', background: '#1E40AF15' },
  Business:    { glyph: '◆',  color: '#7C3AED', background: '#7C3AED15' },
  Performance: { glyph: '⚡',  color: '#B91C1C', background: '#B91C1C15' },
  Philosophy:  { glyph: '☉',  color: '#B45309', background: '#B4530915' },
  Geopolitics: { glyph: '◍',  color: '#15803D', background: '#15803D15' },
  Health:      { glyph: '✚',  color: '#059669', background: '#05966915' },
  Psychology:  { glyph: '◐',  color: '#A16207', background: '#A1620715' },
  Longevity:   { glyph: '∞',  color: '#059669', background: '#05966915' },
  Literature:  { glyph: '❦',  color: '#7C3AED', background: '#7C3AED15' },
  Economics:   { glyph: '⌃',  color: '#0E7490', background: '#0E749015' },
  History:     { glyph: '◊',  color: '#A16207', background: '#A1620715' },
};

const DEFAULT_STYLE: CategoryStyle = {
  glyph: '◆',
  color: '#1D4ED8',
  background: '#1D4ED815',
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}
