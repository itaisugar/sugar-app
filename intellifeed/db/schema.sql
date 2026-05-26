-- ─────────────────────────────────────────────────────────────────────────────
-- InteliFeed — per-user database schema
-- Run this once in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. PROFILES TABLE ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  date_of_birth   date,
  interests       text[] default '{}'::text[],
  onboarded       boolean default false,
  total_score     integer default 0,
  weekly_streak   integer default 0,
  articles_read   integer default 0,
  podcasts_listened integer default 0,
  books_completed integer default 0,
  plans_completed integer default 0,
  following       integer default 0,
  followers       integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Safely add date_of_birth for projects created before this migration
alter table public.profiles add column if not exists date_of_birth date;

-- 2. ROLE GRANTS ─────────────────────────────────────────────────────────────
-- RLS alone does not grant table access; explicit grants are required.
grant usage on schema public to anon, authenticated;
grant all privileges on public.profiles to authenticated;
grant all privileges on public.profiles to service_role;
grant select on public.profiles to anon;

-- 3. ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 3. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. KEEP updated_at FRESH ON UPDATE ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5. BACKFILL PROFILES FOR EXISTING USERS (safe to re-run) ───────────────────
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
