'use client';

import { useState } from 'react';
import { FeedItem, Topic } from '@/types';
import { store } from '@/data/store';
import TopBar from '@/components/layout/TopBar';
import TopicChips from '@/components/feed/TopicChips';
import ContentCard from '@/components/feed/ContentCard';

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>(store.getFeedItems());
  const [selectedTopic, setSelectedTopic] = useState<Topic>('All');

  const filtered =
    selectedTopic === 'All'
      ? items
      : items.filter((item) => item.topic === selectedTopic);

  const handleLike = (id: string) => {
    store.toggleLike(id);
    setItems([...store.getFeedItems()]);
  };

  const handleBookmark = (id: string) => {
    store.toggleBookmark(id);
    setItems([...store.getFeedItems()]);
  };

  const handleAddToPlan = (id: string) => {
    store.addToPlan(id);
    setItems([...store.getFeedItems()]);
  };

  return (
    <>
      <TopBar showLogo showSearch />
      <TopicChips selected={selectedTopic} onSelect={setSelectedTopic} />
      <div className="px-4 py-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm" style={{ color: '#888888' }}>
              No content for this topic yet
            </p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <ContentCard
              key={item.id}
              item={item}
              index={i}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onAddToPlan={handleAddToPlan}
            />
          ))
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </>
  );
}
