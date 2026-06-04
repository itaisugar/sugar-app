## What & why
<!-- One or two sentences: what this PR does and why. -->

## Scope
<!-- Which feature/vertical? e.g. Feed, Clubs, Plan, Profile, infra -->

## Checklist
- [ ] Branched off `dev`, targeting `dev`
- [ ] Small and focused (one feature/fix)
- [ ] Touched a **hot file** (`ui/index.tsx`, `schema.sql`, a `*Context.tsx`, `Theme.ts`/`Colors.ts`, `LanguageContext.tsx`)? → coordinated with partner
- [ ] DB change? migration added via `/add-migration`, `schema.sql` synced, partner notified before running it on the shared DB
- [ ] New user-facing strings go through `LanguageContext` (both languages)
- [ ] No secrets / `.env` / `.DS_Store` committed

## How to test
<!-- Steps to view/verify the change. -->
