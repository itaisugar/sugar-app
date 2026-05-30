-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — v3 migration: let users see the saves and reads of people
-- they follow, so social activity can appear in the main feed.
-- Idempotent; safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- saved_items: own OR followed
drop policy if exists "Users read own saved items" on public.saved_items;
drop policy if exists "Followers see saves" on public.saved_items;
create policy "Followers see saves" on public.saved_items
  for select to authenticated using (
    auth.uid() = user_id
    or exists (
      select 1 from public.follows
      where follower_id = auth.uid() and followed_id = saved_items.user_id
    )
  );

-- read_items: own OR followed
drop policy if exists "Users read own reads" on public.read_items;
drop policy if exists "Followers see reads" on public.read_items;
create policy "Followers see reads" on public.read_items
  for select to authenticated using (
    auth.uid() = user_id
    or exists (
      select 1 from public.follows
      where follower_id = auth.uid() and followed_id = read_items.user_id
    )
  );
