import { supabase } from './supabase';

export type ContentSource = 'curated' | 'featured' | 'community';
export type ContentType = 'article' | 'podcast' | 'research' | 'book' | 'insight';

// Mirrors the public.content_items table row
export type ContentItemRow = {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_avatar: string | null;
  category: string;
  category_color: string | null;
  read_time: number;
  podcast_duration: number | null;
  image_url: string | null;
  content_url: string | null;
  audio_url: string | null;
  content_source: ContentSource;
  content_type: ContentType;
  tags: string[];
  trending_score: number | null;
  likes_count: number;
  saves_count: number;
  published_at: string;
  created_at: string;
};

// UI-friendly shape that the Feed components consume
export type FeedItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceAvatar: string;
  category: string;
  categoryColor: string;
  readTime: number;
  podcastDuration?: number;
  image: string;
  contentSource: ContentSource;
  contentType: ContentType;
  contentUrl: string | null;
  audioUrl: string | null;
  likes: number;
  saves: number;
  isLiked: boolean;            // local-only for now; persisted in Step 2
  isSaved: boolean;            // local-only for now; persisted in Step 2
  timestamp: string;
  tags: string[];
  trendingScore?: number;
};

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function rowToFeedItem(row: ContentItemRow): FeedItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    source: row.source,
    sourceAvatar: row.source_avatar ?? '◆',
    category: row.category,
    categoryColor: row.category_color ?? '#1D4ED8',
    readTime: row.read_time,
    podcastDuration: row.podcast_duration ?? undefined,
    image: row.image_url ?? '',
    contentSource: row.content_source,
    contentType: row.content_type,
    contentUrl: row.content_url ?? null,
    audioUrl: row.audio_url ?? null,
    likes: row.likes_count,
    saves: row.saves_count,
    isLiked: false,
    isSaved: false,
    timestamp: relativeTime(row.published_at),
    tags: row.tags ?? [],
    trendingScore: row.trending_score ?? undefined,
  };
}

export async function fetchContentItems(limit = 50): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ContentItemRow[]).map(rowToFeedItem);
}
