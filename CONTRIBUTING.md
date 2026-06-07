# Working together on Sapience / IntelliFeed

This repo is worked on by more than one person in parallel. Follow this flow to
stay out of each other's way and keep `main` shippable.

## Branches

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Stable, releasable | Never push directly. Only updated via PR from `dev`. |
| `dev` | Integration | Never push directly. Feature PRs merge here. |
| `feature/*`, `fix/*`, `chore/*` | Your work | Branch off `dev`, one per task. |

```bash
git checkout dev && git pull          # always start fresh
git checkout -b feature/bookmarks-ui  # your task branch
# ...work, commit...
git push -u origin feature/bookmarks-ui
gh pr create --base dev               # open PR into dev
```

- **Small, focused PRs** — one feature/fix per PR. Easier to review, fewer conflicts.
- **Pull `dev` often** — at least every morning, and before starting any new branch.
- Releasing: open a PR from `dev` → `main` when `dev` is stable.

## Split work by feature, not by layer

Each feature spans 4 layers: `db/` → `lib/` → `components/` → `app/`. Own whole
verticals so you rarely touch the same file as your partner.

A natural split along the four tabs:

- **Person A — Feed + Plan:** `app/(tabs)/index.tsx`, `app/(tabs)/plan.tsx`,
  `components/screens/FeedScreen.tsx`, `PlanScreen.tsx`,
  lib: `content`, `briefing`, `reads`, `saved`, `bookmarks`
- **Person B — Clubs + Profile:** `app/(tabs)/clubs.tsx`, `app/(tabs)/profile.tsx`,
  `components/screens/ClubsScreen.tsx`, `ProfileScreen.tsx`,
  lib: `clubs`, `peers`, `follows`, `social`, `knowledge`, `profile`

## Hot files — coordinate before editing (ping your partner first)

These are single files both of you will want. A quick message avoids a painful merge.

- **`intellifeed/components/ui/index.tsx`** — all design-system primitives live here.
  Only one person adds primitives at a time. (If it keeps colliding, split it into
  `ui/Card.tsx`, `ui/Button.tsx`, …)
- **`intellifeed/db/schema.sql`** — edited on every migration. The migration files
  themselves are safe (one per change); the `schema.sql` sync is the conflict point.
- **`intellifeed/lib/*Context.tsx`** (`AuthContext`, `ProfileContext`,
  `LanguageContext`, `PodcastPlayerContext`) — global state; renames ripple everywhere.
- **`intellifeed/constants/Theme.ts` & `Colors.ts`** — add tokens, don't change
  existing ones without agreeing.
- **`intellifeed/lib/LanguageContext.tsx`** — i18n strings. Add yours at *different
  ends* of the file to minimise overlap.

## Database migrations (shared DB!)

The Supabase project is **shared** — a migration one person runs in the SQL Editor
affects the other immediately. So:

1. `git pull dev` before creating a migration (so you see the latest version number).
2. Use the **next** version number: `migrations_v<N>[_topic].sql`. Coordinate so you
   don't both grab the same `N`.
3. The `/add-migration` skill (in `.claude/skills/`) automates the conventions —
   versioned file, grants, RLS, `schema.sql` sync, client types.
4. **Announce** before running a migration in the Dashboard, since it hits the shared DB.

## Environment

- `intellifeed/.env` is git-ignored. Each person keeps their own copy.
- Copy `intellifeed/.env.example` → `intellifeed/.env` and fill in the shared
  Supabase URL + anon key.

## Commits

- Present-tense, scoped messages: `Feed: add bookmark button to cards`.
- Don't commit `.env`, secrets, or `.DS_Store`.
- `.claude/` (skills) **is** committed — shared tooling for the whole team.
