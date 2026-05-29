import { supabase } from './supabase';
import { searchProfiles, PublicProfile } from './peers';
import { FeedItem, ContentItemRow } from './content';
import { INTEREST_OPTIONS } from '../constants/Interests';

export type SearchResults = {
  people: PublicProfile[];
  topics: string[];
  articles: FeedItem[];
};

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

async function searchArticles(query: string): Promise<FeedItem[]> {
  // PostgREST .or() filter — match against title, summary, source, or category
  const pattern = `%${query}%`;
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .or(
      `title.ilike.${pattern},summary.ilike.${pattern},source.ilike.${pattern},category.ilike.${pattern}`,
    )
    .order('published_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  // Also filter client-side by tag (PostgREST array contains is awkward across or-conditions)
  return (data as ContentItemRow[]).map(rowToFeedItem);
}

function searchTopics(query: string): string[] {
  const q = query.toLowerCase();
  return INTEREST_OPTIONS.filter(t => t.toLowerCase().includes(q));
}

export async function unifiedSearch(query: string, currentUserId?: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { people: [], topics: [], articles: [] };
  }

  // Run the three queries in parallel
  const [people, articlesRaw] = await Promise.all([
    searchProfiles(trimmed, currentUserId).catch(() => [] as PublicProfile[]),
    searchArticles(trimmed).catch(() => [] as FeedItem[]),
  ]);

  // Augment articles by tag match (client side, since tags is a text[])
  const tagMatches = articlesRaw.filter(a =>
    a.tags.some(t => t.toLowerCase().includes(trimmed.toLowerCase())),
  );
  // Merge + dedupe (priority to direct title/summary matches)
  const seen = new Set<string>();
  const articles = [...articlesRaw, ...tagMatches].filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const topics = searchTopics(trimmed);

  return { people, topics, articles };
}
