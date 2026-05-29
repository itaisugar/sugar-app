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
    isSaved: false,
    timestamp: relativeTime(row.published_at),
    tags: row.tags ?? [],
    trendingScore: row.trending_score ?? undefined,
  };
}

// Add or move a leaf to a specific branch. UPSERT semantics.
export async function addLeaf(contentId: string, branch: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('knowledge_leaves')
    .upsert(
      { user_id: user.id, content_id: contentId, branch },
      { onConflict: 'user_id,content_id' },
    );
  if (error) throw error;
}

export async function removeLeaf(contentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('knowledge_leaves')
    .delete()
    .eq('user_id', user.id)
    .eq('content_id', contentId);
  if (error) throw error;
}

// Which branch (if any) is this article filed under for the current user?
export async function getLeafBranch(contentId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('knowledge_leaves')
    .select('branch')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .maybeSingle();
  if (error) throw error;
  return data?.branch ?? null;
}

// Branch summary: branch name → count of leaves. Used by the tree to size nodes.
export async function fetchBranchCounts(): Promise<Record<string, number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data, error } = await supabase
    .from('knowledge_leaves')
    .select('branch')
    .eq('user_id', user.id);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const b = (row as any).branch as string;
    counts[b] = (counts[b] ?? 0) + 1;
  }
  return counts;
}

// All leaves under a specific branch, newest first.
export async function fetchLeavesForBranch(branch: string): Promise<FeedItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('knowledge_leaves')
    .select('created_at, content:content_items(*)')
    .eq('user_id', user.id)
    .eq('branch', branch)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => (row.content ? rowToFeedItem(row.content as ContentItemRow) : null))
    .filter((x): x is FeedItem => x !== null);
}
