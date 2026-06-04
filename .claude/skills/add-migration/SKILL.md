---
name: add-migration
description: Author a new Supabase/Postgres migration for IntelliFeed following the project's idempotent conventions — versioned SQL file, grants, RLS policies, schema.sql sync, and hand-written client types. Use when adding/altering a table or column, changing RLS, adding a cron job, or any DB schema change in intellifeed/db.
---

# add-migration

Create a new database migration for the IntelliFeed app (`intellifeed/db/`) that
matches the existing conventions exactly. Migrations here are **applied by hand**
in the Supabase Dashboard SQL Editor — so every migration must be **idempotent**
(safe to re-run) and self-contained.

Supabase project ref: `yibhqvqlgiwkupimfdzl`

## Before writing

1. Read the current state so the new migration is consistent:
   - `intellifeed/db/schema.sql` — the canonical full schema (keep it the source of truth).
   - The latest `intellifeed/db/migrations_v*.sql` to see the highest version number and style.
2. Decide the file name: `migrations_v<N>[_<topic>].sql`, where `<N>` is the next
   version number. Use a short topic suffix when the migration is themed
   (e.g. `migrations_v4_cron.sql`). Examples already in repo: `migrations_v2.sql`,
   `migrations_v3.sql`, `migrations_v4_cron.sql`.
3. Confirm with the user what the migration should change if it isn't fully specified.

## Conventions (must follow)

- **Idempotent everything.** Use `create table if not exists`, `alter table … add
  column if not exists`, `create index if not exists`, and the
  `drop policy if exists "…" on …;` → `create policy "…"` pattern. Never assume a
  clean DB.
- **Section headers** use the box-drawing style already in the files:
  ```sql
  -- ─────────────────────────────────────────────────────────────────────────────
  -- <Title> — <one-line purpose>
  -- ─────────────────────────────────────────────────────────────────────────────
  ```
- **Schema is `public`.** All objects are `public.<name>`.
- **Comment the *why*** above non-obvious policies/grants, matching the existing
  tone (see the discovery-policy and grants comments in `schema.sql`).

### Grants block (do not skip — this is the #1 thing that silently breaks)
RLS alone does **not** grant table access, and newly created tables don't always
inherit Supabase's default grants. For every new table add explicit grants:
```sql
grant usage on schema public to anon, authenticated;            -- once is enough, harmless to repeat
grant all privileges on public.<table> to authenticated;        -- if end users read/write it
grant all                on public.<table> to service_role;      -- if an edge function writes it
grant select             on public.<table> to anon;              -- only if it must be readable when signed out
```
Match access to intent: a table written **only** by an edge function (service role)
needs `service_role` grants but usually *not* `authenticated` write grants.

### RLS block
Enable RLS on every new table, then add policies scoped to the real access pattern.
Reference patterns already in the repo:
- Own-row only: `using (auth.uid() = user_id)` (see `schema.sql` profiles).
- Own OR followed: the `follows` EXISTS subquery (see `migrations_v3.sql`).
- Admin-only read: `exists (select 1 from public.profiles p where p.id = auth.uid()
  and p.is_admin = true)` (see `simulation.sql`).

Remember: the service role **bypasses RLS**, so edge-function inserts keep working
even with restrictive policies — lock reads down to who should actually see the data.

## Steps

1. **Write the migration file** `intellifeed/db/migrations_v<N>[_topic].sql` with,
   in order: header comment → DDL (`create table` / `alter table`) → grants block →
   RLS enable + policies → any indexes → (optional) cron/trigger setup.
2. **Sync `schema.sql`.** Add the same table/columns/policies into
   `intellifeed/db/schema.sql` so it stays the complete current picture. Place new
   objects in a sensibly numbered section and keep the idempotent forms.
3. **Update hand-written client types.** There is no generated `database.types.ts`;
   types live inline in `intellifeed/lib/*.ts`. Find the module that owns this table
   (e.g. `content.ts`, `social.ts`, `saved.ts`, `reads.ts`, `admin.ts`) — or create a
   new `lib/<feature>.ts` module if none fits — and update/add the TypeScript
   interface and any query functions to match the new columns.
4. **Special cases:**
   - **Cron jobs:** follow `migrations_v4_cron.sql` — `create extension if not exists
     pg_cron/pg_net`, unschedule-if-exists guard, then `cron.schedule(...)`. Document
     any required `supabase secrets set …` and `supabase functions deploy … --project-ref
     yibhqvqlgiwkupimfdzl` prerequisites in the header comment.
   - **New edge function table:** mirror `simulation.sql` (service_role grants +
     admin-only read RLS).

## After writing — report to the user

Migrations are not auto-applied. Tell the user exactly how to run it:

> Apply in **Supabase Dashboard → SQL Editor → New Query**, paste
> `intellifeed/db/migrations_v<N>.sql`, Run. (It's idempotent, safe to re-run.)
> If it includes cron/secrets/function deploys, list those prerequisite commands too.

Then summarize: what changed in the migration, what you mirrored into `schema.sql`,
and which `lib/*.ts` types you updated.

## Checklist (verify before finishing)
- [ ] File named `migrations_v<N>[_topic].sql`, next version number.
- [ ] Fully idempotent (re-running causes no errors).
- [ ] Explicit grants for every new table, scoped to intent.
- [ ] RLS enabled + policies matching the real access pattern.
- [ ] `schema.sql` updated to match.
- [ ] Relevant `lib/*.ts` interface/queries updated.
- [ ] User told how to apply it (+ any cron/secret/deploy prerequisites).
