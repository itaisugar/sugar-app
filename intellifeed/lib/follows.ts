import { supabase } from './supabase';

export async function followUser(followedId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  if (user.id === followedId) throw new Error("You can't follow yourself.");

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, followed_id: followedId });
  if (error && !/duplicate key/i.test(error.message)) throw error;
}

export async function unfollowUser(followedId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followed_id', followedId);
  if (error) throw error;
}

export async function isFollowing(followedId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('follower_id', user.id)
    .eq('followed_id', followedId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Returns a Set of profile IDs the current user follows, restricted to candidateIds.
// Used to badge results in search lists.
export async function getFollowedSubset(candidateIds: string[]): Promise<Set<string>> {
  if (candidateIds.length === 0) return new Set();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', user.id)
    .in('followed_id', candidateIds);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.followed_id as string));
}
