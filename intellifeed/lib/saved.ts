import { supabase } from './supabase';
import { ContentItemRow, FeedItem } from './content';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function rowToFeedItem(row: ContentItemRow): FeedItem {
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
    isSaved: true,
    timestamp: relativeTime(row.published_at),
    tags: row.tags ?? [],
    trendingScore: row.trending_score ?? undefined,
  };
}

export async function saveItem(contentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('saved_items')
    .insert({ user_id: user.id, content_id: contentId });
  // Tolerate "already saved" — composite PK conflict
  if (error && !/duplicate key/i.test(error.message)) throw error;
}

export async function unsaveItem(contentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', user.id)
    .eq('content_id', contentId);
  if (error) throw error;
}

export async function isItemSaved(contentId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { count, error } = await supabase
    .from('saved_items')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('content_id', contentId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Batch helper for marking items in a feed list.
export async function getSavedSubset(contentIds: string[]): Promise<Set<string>> {
  if (contentIds.length === 0) return new Set();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from('saved_items')
    .select('content_id')
    .eq('user_id', user.id)
    .in('content_id', contentIds);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.content_id as string));
}

// Fetch the full content_items for everything the user has saved, newest first.
export async function fetchSavedItems(limit = 50): Promise<FeedItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('saved_items')
    .select('created_at, content:content_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => (row.content ? rowToFeedItem(row.content as ContentItemRow) : null))
    .filter((x): x is FeedItem => x !== null);
}
