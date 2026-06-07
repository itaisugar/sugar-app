-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — v6 migration: remove the Plan feature.
-- Drops the now-unused profiles.plans_completed column. The Plan tab, feed
-- "+ Plan" action, plan-detail screens, and profile plan stats have all been
-- removed from the client.
-- Idempotent; safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles drop column if exists plans_completed;
