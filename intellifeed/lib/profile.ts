import { supabase } from './supabase';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  date_of_birth: string | null; // ISO date (YYYY-MM-DD)
  interests: string[];
  onboarded: boolean;
  is_admin: boolean;
  total_score: number;
  weekly_streak: number;
  day_streak: number;
  last_seen_on: string | null;
  articles_read: number;
  podcasts_listened: number;
  books_completed: number;
  plans_completed: number;
  following: number;
  followers: number;
  created_at: string;
  updated_at: string;
};

export type ProfilePatch = Partial<
  Pick<Profile, 'full_name' | 'date_of_birth' | 'interests' | 'onboarded'>
>;

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function completeOnboarding(
  userId: string,
  full_name: string,
  interests: string[],
): Promise<Profile> {
  return updateProfile(userId, { full_name, interests, onboarded: true });
}
