-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — daily curation cron job.
--
-- Schedules the `curate-daily` Edge Function to run once a day. The function
-- pulls fresh items from a curated RSS list, asks Claude to pick the best
-- few, summarises them via the existing summarize-url function, and inserts
-- the rows into content_items.
--
-- Prerequisites (run in order):
--
-- 1. In the Supabase Dashboard → Database → Extensions, enable:
--      - pg_cron     (Postgres cron scheduling)
--      - pg_net      (HTTP requests from inside Postgres)
--
-- 2. Set the secrets used by the Edge Functions. From a terminal logged in
--    to the supabase CLI:
--      supabase secrets set CURATOR_SECRET=$(openssl rand -hex 32)
--    (any random string; just keep it private)
--
-- 3. Replace <CURATOR_SECRET> in the cron job body below with the same
--    value you set above, then run this migration.
--
-- 4. Deploy the curate-daily function:
--      supabase functions deploy curate-daily --project-ref yibhqvqlgiwkupimfdzl
--      supabase functions deploy summarize-url --project-ref yibhqvqlgiwkupimfdzl  -- has new bypass header
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous version of the job before scheduling a new one.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'sapience-daily-curate') then
    perform cron.unschedule('sapience-daily-curate');
  end if;
end $$;

-- Runs every day at 07:00 UTC.
select cron.schedule(
  'sapience-daily-curate',
  '0 7 * * *',
  $cron$
    select net.http_post(
      url     := 'https://yibhqvqlgiwkupimfdzl.supabase.co/functions/v1/curate-daily',
      headers := jsonb_build_object(
        'Content-Type',       'application/json',
        'X-Curator-Secret',   '<CURATOR_SECRET>'
      ),
      body    := '{}'::jsonb
    );
  $cron$
);

-- To inspect runs after a day or two:
--   select * from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'sapience-daily-curate')
--   order by start_time desc limit 10;
