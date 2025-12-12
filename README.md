# ping! (iOS / Expo)

## Local dev
- Install: `npm install`
- Run: `npx expo start --lan`

## Supabase setup (required)
Follow `SUPABASE_SETUP.md`.

At minimum for v1 you must run these migrations (in order):
- `supabase_migration_phase1_clean.sql`
- `supabase_migration_phase1_contacts_identities.sql`
- `supabase_migration_phase2_circles.sql`
- `supabase_migration_phase2_contact_matches.sql`
- `supabase_migration_phase2_push.sql`

## EAS / TestFlight
1. Install EAS CLI: `npm i -g eas-cli`
2. Initialize: `eas init` (this will generate an EAS projectId)
3. Put that value into `app.json` → `expo.extra.eas.projectId`
4. Build (internal): `eas build -p ios --profile preview`
5. Build (TestFlight): `eas build -p ios --profile production`
6. Submit: `eas submit -p ios --profile production`

## App Store review checklist
See `APP_STORE_REVIEW_SCRIPT.md`.

## Assets you must add before App Store submission
- App icon (1024x1024)
- Splash screen

Add them under `assets/` and reference them from `app.json` (Expo docs: App Icon + Splash Screen).
