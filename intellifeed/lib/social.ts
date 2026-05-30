import { supabase } from './supabase';

export type FollowActivity = {
  id: string;                // composite key for React
  kind: 'saved' | 'read';
  user_id: string;
  author_name: string | null;
  content_id: string;
  content_title: string;
  content_image: string | null;
  content_category: string;
  content_type: string;
  at: string;                // ISO timestamp
};

export async function fetchFollowedActivity(limit = 8): Promise<FollowActivity[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Who do I follow?
  const { data: follows } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', user.id);
  const followedIds = (follows ?? []).map(r => r.followed_id as string);
  if (followedIds.length === 0) return [];

  const [savedRes, readRes] = await Promise.all([
    supabase
      .from('saved_items')
      .select('user_id, created_at, profiles:user_id(full_name), content_items(id, title, image_url, category, content_type)')
      .in('user_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('read_items')
      .select('user_id, read_at, profiles:user_id(full_name), content_items(id, title, image_url, category, content_type)')
      .in('user_id', followedIds)
      .order('read_at', { ascending: false })
      .limit(limit),
  ]);

  const out: FollowActivity[] = [];

  for (const row of (savedRes.data ?? []) as any[]) {
    const c = row.content_items;
    if (!c) continue;
    out.push({
      id: `s-${row.user_id}-${c.id}`,
      kind: 'saved',
      user_id: row.user_id,
      author_name: row.profiles?.full_name ?? null,
      content_id: c.id,
      content_title: c.title,
      content_image: c.image_url ?? null,
      content_category: c.category,
      content_type: c.content_type ?? 'article',
      at: row.created_at,
    });
  }
  for (const row of (readRes.data ?? []) as any[]) {
    const c = row.content_items;
    if (!c) continue;
    out.push({
      id: `r-${row.user_id}-${c.id}`,
      kind: 'read',
      user_id: row.user_id,
      author_name: row.profiles?.full_name ?? null,
      content_id: c.id,
      content_title: c.title,
      content_image: c.image_url ?? null,
      content_category: c.category,
      content_type: c.content_type ?? 'article',
      at: row.read_at,
    });
  }

  // Sort by time desc and cap
  out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // De-dupe: if the same content shows up twice for the same user (saved+read),
  // prefer the more meaningful action ("read" > "saved").
  const seen = new Map<string, FollowActivity>();
  for (const a of out) {
    const key = `${a.user_id}:${a.content_id}`;
    const prev = seen.get(key);
    if (!prev) seen.set(key, a);
    else if (prev.kind === 'saved' && a.kind === 'read') seen.set(key, a);
  }

  return Array.from(seen.values()).slice(0, limit);
}

export function activityVerb(a: FollowActivity): string {
  if (a.kind === 'read') {
    if (a.content_type === 'podcast') return 'listened to';
    if (a.content_type === 'book') return 'is reading';
    return 'read';
  }
  // saved
  if (a.content_type === 'podcast') return 'saved a podcast';
  if (a.content_type === 'book') return 'saved a book';
  return 'saved';
}
