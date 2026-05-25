interface AchievementBadgeProps {
  emoji: string;
  label: string;
}

export default function AchievementBadge({ emoji, label }: AchievementBadgeProps) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border"
      style={{ backgroundColor: '#1E1E1E', borderColor: '#2A2A2A' }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: '#AAAAAA' }}>
        {label}
      </span>
    </div>
  );
}
