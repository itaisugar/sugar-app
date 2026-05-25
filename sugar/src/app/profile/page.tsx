'use client';

import { Settings, ChevronRight } from 'lucide-react';
import { store } from '@/data/store';
import TopBar from '@/components/layout/TopBar';
import StatsRow from '@/components/profile/StatsRow';
import AchievementBadge from '@/components/profile/AchievementBadge';
import ActivityItem from '@/components/profile/ActivityItem';

export default function ProfilePage() {
  const profile = store.getProfile();

  return (
    <>
      <TopBar
        title="Profile"
        rightElement={
          <button className="p-1 transition-opacity active:opacity-60">
            <Settings size={20} style={{ color: '#888888' }} />
          </button>
        }
      />

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ backgroundColor: '#D48B2C', color: '#000' }}
          >
            {profile.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="font-bold leading-tight"
              style={{ fontSize: '18px', color: '#F5F5F5' }}
            >
              {profile.name}
            </h2>
            <p className="text-sm" style={{ color: '#888888' }}>
              {profile.handle}
            </p>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#AAAAAA' }}>
              {profile.bio}
            </p>
          </div>
        </div>

        {/* Stats */}
        <StatsRow
          streakDays={profile.stats.streakDays}
          booksRead={profile.stats.booksRead}
          papersRead={profile.stats.papersRead}
          clubRank={profile.stats.clubRank}
        />

        {/* Interests */}
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: '#F5F5F5' }}
          >
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(212, 139, 44, 0.12)',
                  color: '#D48B2C',
                  border: '1px solid rgba(212, 139, 44, 0.25)',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
              Achievements
            </h3>
            <button className="text-xs flex items-center gap-0.5" style={{ color: '#888888' }}>
              See all <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {profile.achievements.map((ach) => (
              <AchievementBadge key={ach.id} emoji={ach.emoji} label={ach.label} />
            ))}
          </div>
        </div>

        {/* Friends */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
              Friends
            </h3>
            <button className="text-xs" style={{ color: '#D48B2C' }}>
              + Invite
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {profile.friends.map((friend) => (
              <div key={friend.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: friend.color, color: '#fff' }}
                >
                  {friend.initials}
                </div>
                <span className="text-xs" style={{ color: '#AAAAAA' }}>
                  {friend.name}
                </span>
                <div className="flex items-center gap-0.5">
                  <span style={{ fontSize: '10px' }}>🔥</span>
                  <span className="text-[11px] font-medium" style={{ color: '#D48B2C' }}>
                    {friend.streak}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#F5F5F5' }}>
            Recent Activity
          </h3>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: '#141414', borderColor: '#2A2A2A' }}
          >
            {profile.recentActivity.map((activity, i) => (
              <div key={activity.id}>
                <div className="px-4">
                  <ActivityItem
                    icon={activity.icon}
                    description={activity.description}
                    timestamp={activity.timestamp}
                  />
                </div>
                {i < profile.recentActivity.length - 1 && (
                  <div style={{ height: '1px', backgroundColor: '#1E1E1E', marginLeft: '64px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </>
  );
}
