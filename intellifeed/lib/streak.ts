import { supabase } from './supabase';

// Bumps the user's day_streak once per UTC day. Safe to call on every app
// open; the DB function deduplicates same-day calls.
export async function touchDayStreak(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('touch_day_streak');
}
