import { supabase } from './supabase';

// PublicProfile — strict subset of Profile that's safe to display to others.
// We never request email or date_of_birth via this service.
export type PublicProfile = {
  id: string;
  full_name: string | null;
  interests: string[];
  total_score: number;
  weekly_streak: number;
  articles_read: number;
  podcasts_listened: number;
  books_completed: number;
  plans_completed: number;
  following: number;
  followers: number;
  created_at: string;
};

const PUBLIC_COLUMNS =
  'id, full_name, interests, total_score, weekly_streak, articles_read, podcasts_listened, books_completed, plans_completed, following, followers, created_at';

export async function searchProfiles(query: string, currentUserId?: string): Promise<PublicProfile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  let q = supabase
    .from('profiles')
    .select(PUBLIC_COLUMNS)
    .ilike('full_name', `%${trimmed}%`)
    .not('full_name', 'is', null)
    .order('total_score', { ascending: false })
    .limit(20);

  if (currentUserId) {
    q = q.neq('id', currentUserId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicProfile) ?? null;
}
