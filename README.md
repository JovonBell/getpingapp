# ping! (iOS / Expo)

## Changelog

### December 16, 2025
**UX Improvements & Bug Fixes**

**circlesStorage.js:**
- Fixed tier constraint error - tier now starts at 1 (was 0)
- Added max 5 circles limit with friendly error message
- Added specific error handling for database tier constraint violations

**SelectContactsScreen.js:**
- Removed non-functional "done" button, replaced with selected count display
- Added loading spinner to "import selected" button
- Button disabled during import to prevent double-taps
- Added "No Contacts Selected" alert validation
- Added error handling around save/navigate logic

**VisualizeCircleScreen.js:**
- Added loading spinner to "create circle" button
- Button disabled during creation to prevent double-taps
- Proper error state reset on all failure paths

**HomeScreen.js:**
- Added prominent "Create Your First Circle" button for new users
- Only appears when user has no circles yet
- Styled with glow effect matching app theme

---

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
