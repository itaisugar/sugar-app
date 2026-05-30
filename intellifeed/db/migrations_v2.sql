-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — migrations for: club membership/comments, article reads,
-- daily-login streak. Idempotent; safe to re-run. Run in SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. CLUB_MEMBERS ────────────────────────────────────────────────────────────
-- Clubs themselves are defined client-side (constants/MockData.ts); we only
-- persist who has joined which club, keyed by the client-side string id.
create table if not exists public.club_members (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  club_id    text not null,
  joined_at  timestamptz default now(),
  primary key (user_id, club_id)
);

create index if not exists club_members_club_idx on public.club_members (club_id);

grant select, insert, delete on public.club_members to authenticated;
grant all privileges on public.club_members to service_role;

alter table public.club_members enable row level security;

drop policy if exists "Members readable by all" on public.club_members;
create policy "Members readable by all" on public.club_members
  for select to authenticated using (true);

drop policy if exists "Users join as themselves" on public.club_members;
create policy "Users join as themselves" on public.club_members
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users leave only their own" on public.club_members;
create policy "Users leave only their own" on public.club_members
  for delete to authenticated using (auth.uid() = user_id);


-- 2. CLUB_COMMENTS ───────────────────────────────────────────────────────────
create table if not exists public.club_comments (
  id          uuid primary key default gen_random_uuid(),
  club_id     text not null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (length(body) between 1 and 2000),
  created_at  timestamptz default now()
);

create index if not exists club_comments_club_idx
  on public.club_comments (club_id, created_at desc);

grant select, insert, delete on public.club_comments to authenticated;
grant all privileges on public.club_comments to service_role;

alter table public.club_comments enable row level security;

-- Anyone authenticated can read any comment (clubs feel public-by-membership;
-- gating is done client-side by whether the user has joined).
drop policy if exists "Comments readable by all" on public.club_comments;
create policy "Comments readable by all" on public.club_comments
  for select to authenticated using (true);

-- Must be a member of the club to post.
drop policy if exists "Members post comments" on public.club_comments;
create policy "Members post comments" on public.club_comments
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.club_members m
      where m.user_id = auth.uid() and m.club_id = club_comments.club_id
    )
  );

drop policy if exists "Users delete own comments" on public.club_comments;
create policy "Users delete own comments" on public.club_comments
  for delete to authenticated using (auth.uid() = user_id);


-- 3. READ_ITEMS ──────────────────────────────────────────────────────────────
-- One row per (user, article). Inserting bumps the profile's articles_read
-- counter and adds 5 points to total_score.
create table if not exists public.read_items (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  read_at    timestamptz default now(),
  primary key (user_id, content_id)
);

create index if not exists read_items_user_idx
  on public.read_items (user_id, read_at desc);

grant select, insert, delete on public.read_items to authenticated;
grant all privileges on public.read_items to service_role;

alter table public.read_items enable row level security;

drop policy if exists "Users read own reads" on public.read_items;
create policy "Users read own reads" on public.read_items
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users mark as themselves" on public.read_items;
create policy "Users mark as themselves" on public.read_items
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users unmark only their own" on public.read_items;
create policy "Users unmark only their own" on public.read_items
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.handle_read_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles
      set articles_read = articles_read + 1,
          total_score   = total_score + 5
      where id = NEW.user_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.profiles
      set articles_read = greatest(0, articles_read - 1),
          total_score   = greatest(0, total_score - 5)
      where id = OLD.user_id;
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists read_items_change on public.read_items;
create trigger read_items_change
  after insert or delete on public.read_items
  for each row execute function public.handle_read_change();


-- 4. DAY STREAK ──────────────────────────────────────────────────────────────
-- One UTC-day-resolution streak counter that ticks up on first sign-in each
-- day, holds steady on a same-day repeat, and resets after a missed day.
alter table public.profiles add column if not exists last_seen_on date;
alter table public.profiles add column if not exists day_streak  integer default 0;

create or replace function public.touch_day_streak()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prev date;
  cur  integer;
begin
  select last_seen_on, coalesce(day_streak, 0)
    into prev, cur
  from public.profiles
  where id = auth.uid();

  if prev is null then
    update public.profiles
      set day_streak = 1, last_seen_on = current_date
      where id = auth.uid();
  elsif prev = current_date then
    -- already counted today
    null;
  elsif prev = current_date - interval '1 day' then
    update public.profiles
      set day_streak = cur + 1, last_seen_on = current_date
      where id = auth.uid();
  else
    -- broke the streak
    update public.profiles
      set day_streak = 1, last_seen_on = current_date
      where id = auth.uid();
  end if;
end;
$$;

grant execute on function public.touch_day_streak() to authenticated;
