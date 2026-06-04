-- ════════════════════════════════════════════════════════════
--  Sapience — User Simulation tables
--  Backing store for the `simulate-users` edge function.
--  Written via the service-role key (RLS not required for writes);
--  read access is admin-only.
-- ════════════════════════════════════════════════════════════

create table if not exists public.simulation_runs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  avg_score     numeric,
  would_return  integer,
  total_agents  integer,
  report_text   text,
  raw_results   jsonb
);

create table if not exists public.simulation_agents (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.simulation_runs(id) on delete cascade,
  created_at    timestamptz not null default now(),
  persona       text,
  experience    text,
  onboarding_fb text,
  feed_fb       text,
  would_return  boolean,
  score         integer,
  top_issue     text,
  top_praise    text,
  journey       jsonb,
  followup_q    text,
  followup_a    text
);

create index if not exists simulation_agents_run_id_idx on public.simulation_agents (run_id);
create index if not exists simulation_runs_created_at_idx on public.simulation_runs (created_at desc);

-- The edge function writes with the service role — grant it table privileges.
-- (Newly-created tables don't always inherit Supabase's default grants.)
grant all on public.simulation_runs   to service_role;
grant all on public.simulation_agents to service_role;

-- RLS: lock down to admins only (the edge function uses the service role,
-- which bypasses RLS, so inserts still work).
alter table public.simulation_runs   enable row level security;
alter table public.simulation_agents enable row level security;

drop policy if exists "admins read simulation_runs" on public.simulation_runs;
create policy "admins read simulation_runs" on public.simulation_runs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "admins read simulation_agents" on public.simulation_agents;
create policy "admins read simulation_agents" on public.simulation_agents
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
