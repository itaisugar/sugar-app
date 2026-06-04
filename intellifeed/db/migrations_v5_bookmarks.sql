-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — v5 migration: BOOKMARKS — a private "read later" list.
--
-- Distinct from saved_items: bookmarks are a personal reading queue. They do NOT
-- award score, do NOT bump content_items.saves_count, and are NEVER visible to
-- other users (not even followers). The two mechanisms coexist.
--
-- Idempotent; safe to re-run. Apply in Supabase Dashboard → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.bookmarks (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, content_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);
create index if not exists bookmarks_content_idx on public.bookmarks (content_id);

-- Grants — end users read/write their own rows; service_role for any admin tooling.
grant select, insert, delete on public.bookmarks to authenticated;
grant all privileges on public.bookmarks to service_role;

-- RLS — strictly private: a user only ever sees and writes their own bookmarks.
alter table public.bookmarks enable row level security;

drop policy if exists "Users read own bookmarks" on public.bookmarks;
create policy "Users read own bookmarks" on public.bookmarks
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users bookmark as themselves" on public.bookmarks;
create policy "Users bookmark as themselves" on public.bookmarks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users remove only their own bookmarks" on public.bookmarks;
create policy "Users remove only their own bookmarks" on public.bookmarks
  for delete to authenticated using (auth.uid() = user_id);
