import { timeAgo } from '@/lib/utils';

interface ActivityItemProps {
  icon: string;
  description: string;
  timestamp: string;
}

export default function ActivityItem({ icon, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      {/* Icon bubble */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{ backgroundColor: '#1E1E1E' }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug line-clamp-2"
          style={{ color: '#AAAAAA' }}
        >
          {description}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
          {timeAgo(timestamp)}
        </p>
      </div>
    </div>
  );
}
