interface Stat {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}

interface StatsRowProps {
  streakDays: number;
  booksRead: number;
  papersRead: number;
  clubRank: string;
}

export default function StatsRow({ streakDays, booksRead, papersRead, clubRank }: StatsRowProps) {
  const stats: Stat[] = [
    { label: 'Streak', value: `${streakDays}d`, icon: '🔥', highlight: streakDays >= 7 },
    { label: 'Books', value: booksRead, icon: '📚' },
    { label: 'Papers', value: papersRead, icon: '📄' },
    { label: 'Rank', value: clubRank, icon: '🏆', highlight: true },
  ];

  return (
    <div
      className="flex rounded-2xl border overflow-hidden"
      style={{ backgroundColor: '#141414', borderColor: '#2A2A2A' }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex-1 flex flex-col items-center py-4 gap-1"
          style={
            i < stats.length - 1
              ? { borderRight: '1px solid #2A2A2A' }
              : {}
          }
        >
          <span className="text-lg">{stat.icon}</span>
          <span
            className="font-bold text-base"
            style={{ color: stat.highlight ? '#D48B2C' : '#F5F5F5' }}
          >
            {stat.value}
          </span>
          <span className="text-xs" style={{ color: '#888888' }}>
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
