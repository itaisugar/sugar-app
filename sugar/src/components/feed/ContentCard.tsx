'use client';

import { Heart, Bookmark, Share2, Clock, Plus, Check } from 'lucide-react';
import { FeedItem } from '@/types';
import SourceBadge from './SourceBadge';
import { formatNumber } from '@/lib/utils';

interface ContentCardProps {
  item: FeedItem;
  index: number;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onAddToPlan: (id: string) => void;
}

export default function ContentCard({
  item,
  index,
  onLike,
  onBookmark,
  onAddToPlan,
}: ContentCardProps) {
  return (
    <div
      className="animate-slide-up rounded-2xl p-4 border"
      style={{
        backgroundColor: '#141414',
        borderColor: '#2A2A2A',
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <SourceBadge type={item.type} />
        <div className="flex items-center gap-1" style={{ color: '#888888' }}>
          <Clock size={12} />
          <span className="text-xs">{item.readTime} min</span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-semibold mb-1 line-clamp-2 leading-snug"
        style={{ fontSize: '15px', color: '#F5F5F5' }}
      >
        {item.title}
      </h3>

      {/* Author & Source */}
      <p className="text-xs mb-3" style={{ color: '#888888' }}>
        {item.author} · <span style={{ color: '#AAAAAA' }}>{item.source}</span>
      </p>

      {/* AI Summary */}
      <p
        className="text-sm line-clamp-3 mb-3 leading-relaxed"
        style={{ color: '#AAAAAA' }}
      >
        {item.summary}
      </p>

      {/* Social proof */}
      {item.friendsRead.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex -space-x-1.5">
            {item.friendsRead.slice(0, 3).map((name, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                style={{
                  backgroundColor: ['#7C3AED', '#059669', '#DC2626'][i % 3],
                  borderColor: '#141414',
                  color: '#fff',
                }}
              >
                {name[0]}
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ color: '#D48B2C' }}>
            {item.friendsRead.length === 1
              ? `${item.friendsRead[0]} read this`
              : `${item.friendsRead[0]} + ${item.friendsRead.length - 1} friends read this`}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="mb-3" style={{ height: '1px', backgroundColor: '#2A2A2A' }} />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={() => onLike(item.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-125"
            style={{ color: item.isLiked ? '#F87171' : '#888888' }}
          >
            <Heart
              size={16}
              fill={item.isLiked ? '#F87171' : 'none'}
              strokeWidth={1.8}
            />
            <span className="text-xs font-medium">{formatNumber(item.likeCount)}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onBookmark(item.id)}
            className="p-1.5 rounded-lg transition-all active:scale-110"
            style={{ color: item.isBookmarked ? '#D48B2C' : '#888888' }}
          >
            <Bookmark
              size={16}
              fill={item.isBookmarked ? '#D48B2C' : 'none'}
              strokeWidth={1.8}
            />
          </button>

          {/* Share */}
          <button
            className="p-1.5 rounded-lg transition-all active:scale-110"
            style={{ color: '#888888' }}
          >
            <Share2 size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Add to Plan */}
        <button
          onClick={() => !item.addedToPlan && onAddToPlan(item.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
          style={
            item.addedToPlan
              ? {
                  backgroundColor: 'rgba(212, 139, 44, 0.15)',
                  color: '#D48B2C',
                  border: '1px solid rgba(212, 139, 44, 0.3)',
                }
              : {
                  backgroundColor: '#D48B2C',
                  color: '#000',
                }
          }
        >
          {item.addedToPlan ? (
            <>
              <Check size={13} strokeWidth={2.5} />
              In Plan
            </>
          ) : (
            <>
              <Plus size={13} strokeWidth={2.5} />
              Add to Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
