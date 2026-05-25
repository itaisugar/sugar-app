'use client';

import { Topic } from '@/types';

const topics: Topic[] = [
  'All',
  'AI',
  'Longevity',
  'Psychology',
  'Neuroscience',
  'Productivity',
  'History',
  'Philosophy',
  'Finance',
];

interface TopicChipsProps {
  selected: Topic;
  onSelect: (topic: Topic) => void;
}

export default function TopicChips({ selected, onSelect }: TopicChipsProps) {
  return (
    <div
      className="sticky top-[56px] z-30 px-4 py-3 scrollbar-none flex gap-2 overflow-x-auto border-b"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: '#2A2A2A',
      }}
    >
      {topics.map((topic) => {
        const isActive = selected === topic;
        return (
          <button
            key={topic}
            onClick={() => onSelect(topic)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 active:scale-95"
            style={
              isActive
                ? {
                    backgroundColor: '#D48B2C',
                    color: '#000',
                  }
                : {
                    backgroundColor: '#1E1E1E',
                    color: '#888888',
                    border: '1px solid #2A2A2A',
                  }
            }
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}
