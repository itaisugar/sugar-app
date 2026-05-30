import { supabase } from './supabase';

export async function fetchJoinedClubIds(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.club_id as string));
}

export async function joinClub(clubId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { error } = await supabase
    .from('club_members')
    .insert({ user_id: user.id, club_id: clubId });
  if (error && !/duplicate/i.test(error.message)) throw error;
}

export async function leaveClub(clubId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('user_id', user.id)
    .eq('club_id', clubId);
  if (error) throw error;
}

export type ClubComment = {
  id: string;
  club_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string | null;
};

export async function fetchClubComments(clubId: string, limit = 50): Promise<ClubComment[]> {
  const { data, error } = await supabase
    .from('club_comments')
    .select('id, club_id, user_id, body, created_at, profiles:user_id(full_name)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    club_id: row.club_id,
    user_id: row.user_id,
    body: row.body,
    created_at: row.created_at,
    author_name: row.profiles?.full_name ?? null,
  }));
}

export async function postClubComment(clubId: string, body: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const text = body.trim();
  if (!text) return;
  const { error } = await supabase
    .from('club_comments')
    .insert({ club_id: clubId, user_id: user.id, body: text });
  if (error) throw error;
}

export async function deleteClubComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('club_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

// Activity for the main feed: recent comments from clubs the user is in.
export type ClubActivity = {
  comment_id: string;
  club_id: string;
  body: string;
  created_at: string;
  author_name: string | null;
};

export async function fetchJoinedClubsActivity(limit = 8): Promise<ClubActivity[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const joined = await fetchJoinedClubIds();
  if (joined.size === 0) return [];
  const ids = Array.from(joined);
  const { data, error } = await supabase
    .from('club_comments')
    .select('id, club_id, body, created_at, profiles:user_id(full_name)')
    .in('club_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row: any) => ({
    comment_id: row.id,
    club_id: row.club_id,
    body: row.body,
    created_at: row.created_at,
    author_name: row.profiles?.full_name ?? null,
  }));
}
