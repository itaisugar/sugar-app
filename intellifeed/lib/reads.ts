import { supabase } from './supabase';
import { FeedItem } from './content';

export async function markAsRead(contentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { error } = await supabase
    .from('read_items')
    .insert({ user_id: user.id, content_id: contentId });
  if (error && !/duplicate/i.test(error.message)) throw error;
}

export async function unmarkAsRead(contentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { error } = await supabase
    .from('read_items')
    .delete()
    .eq('user_id', user.id)
    .eq('content_id', contentId);
  if (error) throw error;
}

export async function isItemRead(contentId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('read_items')
    .select('content_id')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .maybeSingle();
  return !!data;
}

export async function fetchReadHistory(): Promise<FeedItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('read_items')
    .select('read_at, content_items(*)')
    .eq('user_id', user.id)
    .order('read_at', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data
    .map((row: any) => row.content_items)
    .filter(Boolean)
    .map((row: any): FeedItem => ({
      id: row.id,
      title: row.title,
      hook: row.hook ?? null,
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
      timestamp: '',
      tags: row.tags ?? [],
      trendingScore: row.trending_score ?? undefined,
    }));
}
