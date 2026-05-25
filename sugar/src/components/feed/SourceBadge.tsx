import { ContentType } from '@/types';

const config: Record<ContentType, { emoji: string; label: string; bg: string; color: string }> = {
  research: {
    emoji: '📄',
    label: 'Research',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#A5B4FC',
  },
  book: {
    emoji: '📚',
    label: 'Book',
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#6EE7B7',
  },
  podcast: {
    emoji: '🎙️',
    label: 'Podcast',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#FCD34D',
  },
};

export default function SourceBadge({ type }: { type: ContentType }) {
  const { emoji, label, bg, color } = config[type];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
