import { supabase } from './supabase';
import { ContentItemRow, FeedItem } from './content';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function fetchContentItem(id: string): Promise<FeedItem | null> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ContentItemRow;
  return {
    id: row.id,
    title: row.title,
    hook: row.hook ?? null,
    summary: row.summary,
    source: row.source,
    sourceAvatar: row.source_avatar ?? '◆',
    category: row.category,
    categoryColor: row.category_color ?? '#7C5234',
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
