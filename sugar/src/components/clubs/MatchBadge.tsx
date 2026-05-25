export default function MatchBadge({ percent }: { percent: number }) {
  const color = percent >= 90 ? '#6EE7B7' : percent >= 75 ? '#D48B2C' : '#888888';
  const bg =
    percent >= 90
      ? 'rgba(110, 231, 183, 0.15)'
      : percent >= 75
      ? 'rgba(212, 139, 44, 0.15)'
      : 'rgba(136, 136, 136, 0.15)';

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{ backgroundColor: bg, color, border: `1px solid ${color}40` }}
    >
      {percent}% match
    </span>
  );
}
