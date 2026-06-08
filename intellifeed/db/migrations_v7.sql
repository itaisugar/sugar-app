-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — v7 migration: profile photos + email notifications.
--
--   1. profiles.avatar_url + notification preference columns
--   2. public `avatars` storage bucket with per-user RLS
--   3. email notifications: pg_net triggers → send-notification Edge Function
--
-- Idempotent; safe to re-run.
--
-- ⚠️  After running this, set the two config values the triggers need (once):
--       alter database postgres
--         set app.settings.edge_url = 'https://<project-ref>.supabase.co';
--       alter database postgres
--         set app.settings.service_role_key = '<service-role-key>';
--     and deploy + configure the function:
--       supabase functions deploy send-notification
--       supabase secrets set RESEND_API_KEY=re_...
--       supabase secrets set NOTIFY_FROM_EMAIL="Sapience <notifications@yourdomain.com>"
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. COLUMNS ──────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists notify_new_follower boolean default true;
alter table public.profiles add column if not exists notify_new_content boolean default true;

-- 2. AVATARS STORAGE BUCKET ───────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read; each user may write only inside their own folder (avatars/<uid>/…).
drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. EMAIL NOTIFICATIONS ───────────────────────────────────────────────────────
create extension if not exists pg_net with schema extensions;

-- POST an event to the send-notification Edge Function. Reads the function URL
-- and service-role key from database settings (see header). If they're not set
-- yet, the call is skipped silently so writes never fail.
create or replace function public.notify_event(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base_url text := current_setting('app.settings.edge_url', true);
  svc_key  text := current_setting('app.settings.service_role_key', true);
begin
  if base_url is null or svc_key is null then
    return;
  end if;
  perform net.http_post(
    url := base_url || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body := payload
  );
end;
$$;

-- New follower → notify the followed user.
create or replace function public.on_new_follow_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_event(jsonb_build_object(
    'type', 'new_follower',
    'follower_id', NEW.follower_id,
    'followed_id', NEW.followed_id
  ));
  return NEW;
end;
$$;

drop trigger if exists follows_notify on public.follows;
create trigger follows_notify
  after insert on public.follows
  for each row execute function public.on_new_follow_notify();

-- New content → fan out to readers whose interests match (handled in the function).
create or replace function public.on_new_content_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_event(jsonb_build_object(
    'type', 'new_content',
    'content_id', NEW.id
  ));
  return NEW;
end;
$$;

drop trigger if exists content_notify on public.content_items;
create trigger content_notify
  after insert on public.content_items
  for each row execute function public.on_new_content_notify();
