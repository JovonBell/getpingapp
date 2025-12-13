# ping! (iOS / Expo)

## Quick Start (No Setup Required!)
The app is fully configured and ready to use:
```bash
npm install
npx expo start --lan
```
Then scan the QR code with Expo Go!

**✅ Supabase backend is pre-configured** - everyone shares the same backend  
**✅ Google OAuth is ready** - sign in works out of the box  
**✅ All features functional** - circles, contacts, messaging, 3D view

---

## Supabase (Already Configured)
The shared Supabase backend is at: `https://ahksxziueqkacyaqtgeu.supabase.co`

**For developers:** If you need to modify the database schema, see `SUPABASE_SETUP.md` for migration scripts.

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
