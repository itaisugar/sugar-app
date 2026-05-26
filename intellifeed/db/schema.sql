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

-- Editorial role flag — set manually for trusted accounts
alter table public.profiles add column if not exists is_admin boolean default false;

-- Audio URL for podcast episodes (idempotent ALTER)
alter table public.content_items add column if not exists audio_url text;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CONTENT_ITEMS TABLE — the editorial library
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.content_items (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  summary           text not null,
  source            text not null,                            -- e.g. "Stanford Sleep Lab"
  source_avatar     text default '◆',
  category          text not null,                            -- e.g. "Science", "AI"
  category_color    text default '#1D4ED8',                   -- hex for category pill
  read_time         integer default 5,                        -- minutes
  podcast_duration  integer,                                  -- seconds (nullable)
  image_url         text,
  content_url       text,                                     -- link to original
  audio_url         text,                                     -- direct MP3 from RSS (nullable)
  content_source    text default 'curated',                   -- curated | featured | community
  content_type      text default 'article',                   -- article | podcast | research | book
  tags              text[] default '{}'::text[],
  trending_score    integer,                                  -- 0-100
  likes_count       integer default 0,
  saves_count       integer default 0,
  published_at      timestamptz default now(),
  created_at        timestamptz default now()
);

-- Grants
grant usage on schema public to anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant all privileges on public.content_items to service_role;

-- RLS — everyone authenticated may READ; nobody writes (except service_role via Dashboard)
alter table public.content_items enable row level security;

drop policy if exists "Content readable by all" on public.content_items;
create policy "Content readable by all" on public.content_items
  for select using (true);

-- Admins (profiles.is_admin = true) may insert/update content
drop policy if exists "Admins write content" on public.content_items;
create policy "Admins write content" on public.content_items
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "Admins update content" on public.content_items;
create policy "Admins update content" on public.content_items
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Useful index for recency-ordered queries
create index if not exists content_items_published_at_idx
  on public.content_items (published_at desc);

-- ─── SEED DATA — 6 hand-picked articles to bootstrap the feed ────────────────
-- Idempotent: only inserts if a row with the same title doesn't already exist.

insert into public.content_items (
  title, summary, source, source_avatar,
  category, category_color, read_time, podcast_duration,
  image_url, content_source, content_type, tags, trending_score,
  likes_count, saves_count
)
select * from (values
  (
    'How REM Sleep Shapes Learning and Creative Synthesis — New Findings from Stanford',
    'A landmark study from Stanford reveals that REM sleep consolidates emotional memory and forges unexpected connections between disparate concepts. Subjects with eight hours of uninterrupted REM solved creative problems 40% more effectively than those whose sleep was fragmented mid-cycle.',
    'Stanford Sleep Lab', '◆',
    'Science', '#0E7490', 6, 480,
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80',
    'curated', 'research',
    array['Sleep', 'Neuroscience', 'Learning', 'Creativity']::text[], 94,
    1243, 387
  ),
  (
    'The AI Model Predicting Cardiac Events Seven Years in Advance — 90% Accuracy',
    'DeepMind''s latest healthcare model analyzes retinal imagery and ECG patterns to forecast myocardial infarction years before symptoms appear. Published in Nature Medicine, the study spans 500,000 patients across 40 countries — a milestone in preventive cardiology.',
    'DeepMind Health', '◇',
    'AI', '#1E40AF', 8, 720,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    'featured', 'research',
    array['AI', 'Medicine', 'Cardiology', 'Prediction']::text[], 99,
    5821, 2103
  ),
  (
    'The Reading Habits of Munger, Buffett, and Gates — What the Architects of Capital Share',
    'An analysis of 200 biographies of leading entrepreneurs reveals that 88% read at least thirty minutes daily, deliberately outside their primary discipline. Buffett dedicates 80% of his working hours to reading: "The more you read, the more frameworks you have for solving problems."',
    'The Deep Reader', '◈',
    'Business', '#7C3AED', 5, 360,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'curated', 'article',
    array['Reading', 'Habits', 'Entrepreneurship', 'Mastery']::text[], null,
    892, 441
  ),
  (
    'Zone 2 Training: The Cellular Science Behind Low-Intensity Endurance',
    'Peter Attia and Andrew Huberman examine why 80% of endurance training should occur in Zone 2 — the conversational heart rate. Recent research demonstrates mitochondrial biogenesis, a 23% reduction in visceral fat, and substantial improvements in insulin sensitivity.',
    'Peter Attia — The Drive', '◉',
    'Performance', '#B91C1C', 7, 1200,
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    'curated', 'podcast',
    array['Longevity', 'Zone 2', 'Endurance', 'Mitochondria']::text[], null,
    2341, 876
  ),
  (
    'Modern Stoicism: How Marcus Aurelius Would Confront the Smartphone Age',
    'A philosophical reading of the Meditations uncovers surprising principles for managing digital distraction. "Those who chase every passing trend are like sleepwalkers" — a reflection on notification-driven consciousness and the architecture of attention.',
    'Daily Stoic', '◊',
    'Philosophy', '#B45309', 9, 540,
    'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
    'curated', 'article',
    array['Stoicism', 'Attention', 'Mindfulness', 'Antiquity']::text[], null,
    1567, 623
  ),
  (
    'The Geopolitics of Silicon: How TSMC Holds the World''s Strategic Balance',
    'A deep analysis of Chris Miller''s Chip War — why a single fabrication facility in Taiwan produces 92% of the world''s advanced semiconductors, and what unfolds if that line of production is contested. Economic, security, and technological implications converge.',
    'Foreign Affairs', '◎',
    'Geopolitics', '#15803D', 12, 900,
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    'featured', 'article',
    array['Geopolitics', 'Semiconductors', 'Macro', 'Strategy']::text[], 87,
    3891, 1432
  )
) as v(title, summary, source, source_avatar, category, category_color, read_time, podcast_duration,
        image_url, content_source, content_type, tags, trending_score, likes_count, saves_count)
where not exists (
  select 1 from public.content_items existing where existing.title = v.title
);

-- ─── BACKFILL content_url for the seeded articles ────────────────────────────
-- Safe to re-run. Updates each known article with a starting URL.
-- Replace these with more specific article URLs anytime via SQL or Table Editor.
update public.content_items
set content_url = case title
  when 'How REM Sleep Shapes Learning and Creative Synthesis — New Findings from Stanford'
    then 'https://news.stanford.edu/'
  when 'The AI Model Predicting Cardiac Events Seven Years in Advance — 90% Accuracy'
    then 'https://deepmind.google/discover/blog/'
  when 'The Reading Habits of Munger, Buffett, and Gates — What the Architects of Capital Share'
    then 'https://fs.blog/buffett-reading/'
  when 'Zone 2 Training: The Cellular Science Behind Low-Intensity Endurance'
    then 'https://peterattiamd.com/category/podcast/'
  when 'Modern Stoicism: How Marcus Aurelius Would Confront the Smartphone Age'
    then 'https://dailystoic.com/'
  when 'The Geopolitics of Silicon: How TSMC Holds the World''s Strategic Balance'
    then 'https://www.foreignaffairs.com/'
  else content_url
end
where content_url is null;
