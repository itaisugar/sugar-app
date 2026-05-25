'use client';

import { Users } from 'lucide-react';
import { Club } from '@/types';
import MatchBadge from './MatchBadge';
import { formatNumber } from '@/lib/utils';

interface ClubCardProps {
  club: Club;
  onToggleJoin: (id: string) => void;
}

export default function ClubCard({ club, onToggleJoin }: ClubCardProps) {
  return (
    <div
      className="relative rounded-2xl border flex flex-col p-3.5"
      style={{ backgroundColor: '#141414', borderColor: '#2A2A2A' }}
    >
      {/* Match badge */}
      <div className="absolute top-3 right-3">
        <MatchBadge percent={club.matchPercent} />
      </div>

      {/* Emoji */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ backgroundColor: '#1E1E1E', fontSize: '24px' }}
      >
        {club.emoji}
      </div>

      {/* Name */}
      <h3
        className="font-semibold leading-snug mb-1 pr-14"
        style={{ fontSize: '13px', color: '#F5F5F5' }}
      >
        {club.name}
      </h3>

      {/* Description */}
      <p
        className="text-xs line-clamp-2 mb-2 leading-relaxed flex-1"
        style={{ color: '#888888' }}
      >
        {club.description}
      </p>

      {/* Members */}
      <div className="flex items-center gap-1 mb-2">
        <Users size={11} style={{ color: '#888888' }} />
        <span className="text-xs" style={{ color: '#888888' }}>
          {formatNumber(club.memberCount)} members
        </span>
      </div>

      {/* Current challenge */}
      <p
        className="text-xs italic mb-3 line-clamp-1"
        style={{ color: '#D48B2C' }}
      >
        ✦ {club.currentChallenge}
      </p>

      {/* Join button */}
      <button
        onClick={() => onToggleJoin(club.id)}
        className="w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
        style={
          club.isJoined
            ? {
                backgroundColor: '#1E1E1E',
                color: '#6EE7B7',
                border: '1px solid rgba(110, 231, 183, 0.3)',
              }
            : club.isPending
            ? {
                backgroundColor: '#1E1E1E',
                color: '#888888',
                border: '1px solid #2A2A2A',
              }
            : {
                backgroundColor: '#D48B2C',
                color: '#000',
              }
        }
      >
        {club.isJoined ? '✓ Joined' : club.isPending ? 'Pending…' : 'Join Club'}
      </button>
    </div>
  );
}
