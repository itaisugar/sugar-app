'use client';

import { useState } from 'react';
import { Club, ClubCategory } from '@/types';
import { store } from '@/data/store';
import TopBar from '@/components/layout/TopBar';
import ClubCard from '@/components/clubs/ClubCard';

type FilterTab = 'all' | ClubCategory;

const tabs: { id: FilterTab; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '✦' },
  { id: 'reading', label: 'Reading', emoji: '📖' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'research', label: 'Research', emoji: '🔬' },
  { id: 'learning', label: 'Learning', emoji: '🎓' },
];

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>(store.getClubs());
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered =
    activeTab === 'all' ? clubs : clubs.filter((c) => c.category === activeTab);

  const joinedCount = clubs.filter((c) => c.isJoined).length;

  const handleToggleJoin = (id: string) => {
    store.toggleJoinClub(id);
    setClubs([...store.getClubs()]);
  };

  return (
    <>
      <TopBar title="Clubs" />

      {/* Joined count banner */}
      {joinedCount > 0 && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-2xl border flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(212, 139, 44, 0.08)',
            borderColor: 'rgba(212, 139, 44, 0.25)',
          }}
        >
          <span className="text-xl">🤝</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
              You&apos;re in {joinedCount} club{joinedCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs" style={{ color: '#888888' }}>
              Join more to expand your network
            </p>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b"
        style={{ borderColor: '#2A2A2A' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-95"
              style={
                isActive
                  ? { backgroundColor: '#D48B2C', color: '#000' }
                  : {
                      backgroundColor: '#1E1E1E',
                      color: '#888888',
                      border: '1px solid #2A2A2A',
                    }
              }
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Clubs grid */}
      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm" style={{ color: '#888888' }}>
              No clubs in this category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((club) => (
              <ClubCard key={club.id} club={club} onToggleJoin={handleToggleJoin} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>
    </>
  );
}
