# ping! (iOS / Expo)

A relationship management app that helps you stay connected with the people who matter most. Visualize your network as a 3D solar system, track your circles, maintain relationship health, and never forget to reach out.

**Website:** https://getping.today
**Bundle ID:** `today.getping.app`
**App Store ID:** `6757105038`

## Features

- **Circles** - Organize contacts into up to 10 customizable tiers (Inner Circle, Close Friends, etc.)
- **3D Visualization** - Interactive planet/circle view of your network (Three.js)
- **NFC Ring** - Program NFC rings with custom URLs for instant contact sharing
- **Relationship Health** - Track how well you're maintaining each relationship
- **Reminders** - Set follow-up reminders for birthdays, check-ins, and more
- **Gamification** - Earn streaks, achievements, and track your engagement
- **Analytics Dashboard** - See your weekly activity and network health trends
- **Push Notifications** - Get reminded to reach out to contacts
- **Sign in with Apple** - Native SIWA on iOS (positioned first per App Store guideline 4.8)
- **Google Sign-In** - OAuth via Supabase with `email profile` scopes
- **Report/Block** - UGC moderation via ActionSheet in chat (Supabase `reports` + `blocked_users` tables)
- **Account Deletion** - Settings → Profile → Delete Account
- **Immersive Audio** - Ambient music and tactile sound effects
- **Magic Link Auth** - Passwordless email authentication

## App Store Submission Status

**Build 45** submitted February 24, 2026. All previous rejection issues resolved:
- Google OAuth scopes fixed (`email profile`)
- SIWA button ordering (Apple above Google on all auth screens)
- SIWA name persistence to user metadata
- Profile auto-populate from auth data
- Optional field labels for Email/Phone
- Report/Block flow in ChatScreen with Supabase moderation tables
- Tappable Terms/Privacy links → https://getping.today/terms and /privacy
- Account deletion via Supabase edge function

**Google OAuth:** Client ID `883735243677-us7b...` (Ping! Auth), consent screen in Production mode.
**Supabase:** `ahksxziueqkacyaqtgeu` — reports, blocked_users tables with RLS.

## Changelog

### February 24, 2026
**App Store Resubmission (Build 45)**

Fixed all 4 previous App Store rejections:
- Google OAuth: Added scopes, switched to own client ID (was using Supabase default)
- HIG: Apple Sign-In button above Google on WelcomeScreen + CreateAccountScreen
- UGC Moderation: Report/Block ActionSheet in ChatScreen with Supabase tables
- Account Deletion: delete-account edge function
- Legal: Terms/Privacy pages live at getping.today, tappable in-app links
- Profile: Auto-populate from SIWA/Google, optional field labels
- URLs: All in-app links updated to getping.today

---

### January 6, 2026
**Button Loading State Fixes**

Fixed buttons in the contacts feature that would get stuck in loading states and timeout without recovering.

**SelectContactsScreen - "import selected" / "continue":**
- Added 15-second timeout to `saveImportedContacts` to prevent indefinite hangs

**AddContactScreen - "Add to Circle" (Major Fix):**
- Fixed fire-and-forget async pattern that had NO loading state and NO error handling
- Added proper `isSaving` state with loading indicator
- Added 15-second timeout to prevent hanging
- Added user-friendly error alerts with timeout-specific messaging
- Tier buttons now disabled during save with visual feedback

**AddContactModal - "Add to Circle":**
- Added 15-second timeout to `onSave` callback
- Improved error messaging for timeout vs other failures

**Files Updated:**
- `screens/onboarding/SelectContactsScreen.js` - Added timeout wrapper
- `screens/contacts/AddContactScreen.js` - Complete async/loading overhaul
- `components/modals/AddContactModal.js` - Added timeout to callback

---

### January 5, 2026
**Critical Persistence & 3D Rendering Fixes**

**Circle Persistence (Finally Fixed!):**
- Circles now load reliably on app restart using `useFocusEffect`
- Fixed timing bug where 3D view rendered before data loaded
- Added `contactMeshesRef` and `contactGlowsRef` for persistent mesh storage
- Dynamic mesh creation now works when circles arrive after GL init

**Circle Deletion (Now Works!):**
- Delete actually persists to database (race condition fixed)
- 3D view updates immediately when circles deleted (no restart needed)
- Added `justDeleted` flag to prevent reload race conditions
- Extended reload lockout from 500ms to 1500ms for safety

**Expo Go Compatibility:**
- Fixed native module errors for expo-notifications
- Fixed WebBrowser.maybeCompleteAuthSession crash
- Fixed musicManager/soundManager init errors
- Lazy load NFCRingScreen to avoid native module crash
- Fixed `removeNotificationSubscription` cleanup error

**Bug Fixes:**
- Fixed `healthStatus.replace()` undefined error in HealthIndicator
- Added diagnostic logging to circlesStorage for debugging

**Files Updated:**
- `screens/main/HomeScreen.js` - useFocusEffect, delete race condition fix
- `components/3d/UniverseHomeView.js` - Dynamic mesh creation/cleanup
- `utils/storage/circlesStorage.js` - Diagnostic logging
- `utils/notifications/pushNotifications.js` - Expo Go guard
- `utils/storage/supabaseStorage.js` - WebBrowser try-catch
- `utils/musicManager.js`, `utils/soundManager.js` - Init try-catch
- `components/contacts/HealthIndicator.js` - Null check fix
- `App.js` - NFCRingScreen lazy load, notification cleanup fix

---

### January 2, 2026 (Afternoon)
**Comprehensive Bug Fix Release**

**Critical Loading Fixes:**
- Fixed loading spinner stuck on circle creation (added missing state reset)
- Fixed "Create First Circle" showing when circles exist (removed early return race condition)
- Consolidated import loading state with try-finally pattern for reliability

**Visual Improvements:**
- Removed cross/X pattern from contact orbs (perpendicular torus ring)
- Restored contact name labels below spheres
- Increased circle spin speed 3x for more visible animation

**Error Handling:**
- Added user-facing error alerts in AddContactModal
- Added user-facing error alerts in EditContactModal
- Added user-facing error alerts in AddReminderModal
- Added disabled button styling during import operations

**Files Updated:**
- `screens/onboarding/VisualizeCircleScreen.js` - Loading state fix
- `screens/main/HomeScreen.js` - Race condition fix
- `screens/onboarding/SelectContactsScreen.js` - Loading consolidation
- `components/3d/ContactTextureHelper.js` - Visual fix
- `components/3d/UniverseHomeView.js` - Names + spin speed
- `components/modals/*.js` - Error handling

---

### January 2, 2026 (Morning)
**Immersive Audio System & Enhanced Onboarding**

**Audio System:**
- Added sound effects: tap (button clicks), success (achievements), whoosh (transitions), chime (celebrations)
- Added ambient background music: onboarding (dreamy lo-fi), home (cosmic space), focus (calm minimal)
- Volume controls and toggles in Settings → Sound & Music
- Audio sourced from royalty-free libraries (CC0/Free for Profit)

**Enhanced Onboarding:**
- Floating particle backgrounds with themed animations (welcome, contacts, goals, complete)
- HapticButton component with tactile feedback and ripple effects
- Device motion parallax for immersive particle movement

**New Auth Options:**
- Email/password authentication
- Magic link (passwordless) login - enter email, click link, signed in
- Improved auth state management in App.js

**New Files:**
- `utils/soundManager.js` - Sound effects playback and settings
- `utils/musicManager.js` - Background music with fade in/out
- `components/onboarding/HapticButton.js` - Tactile button component
- `components/onboarding/ParticleBackground.js` - Animated particle system
- `screens/onboarding/EmailAuthScreen.js` - Email/password auth
- `screens/onboarding/MagicLinkSentScreen.js` - Magic link confirmation
- `assets/sounds/` - tap.mp3, success.mp3, whoosh.mp3, chime.mp3
- `assets/music/` - ambient_onboarding.mp3, ambient_home.mp3, ambient_focus.mp3
- `assets/AUDIO_LICENSES.md` - Audio attribution and licenses

---

### January 1, 2026 (Evening)
**Instant Contact Loading & UI Polish**

- Contacts now load immediately on app startup (no animation delay)
- Entrance animation only plays for newly created circles
- Removed "needs attention" banner from top of screen
- More transparent floating glass panels for immersive 3D view
- Dismissable bottom hint (tap to hide "Tap a person to view" message)
- Faster entrance animation when it does play (800ms vs 1200ms)

---

### January 1, 2026
**NFC Ring Programming, Circle Limit Increase & Bug Fixes**

**NFC Ring Features:**
- Program NFC rings with custom URLs (Instagram, YouTube, website, etc.)
- Read ring contents to verify what's stored
- Fixed iOS SDK 26 NFC entitlement issue (`includeNdefEntitlement: false`)

**Circle Limit Increase:**
- Increased max circles from 6 to **10**
- Added rotation speeds for rings 7-10 in 3D universe view
- Reduced ring spacing to fit 10 rings comfortably

**Data Loading & Performance:**
- Circles and health scores now load in parallel for faster startup
- Fixed race condition with loading lock to prevent duplicate calls
- Health map set before circles so contacts render with correct colors immediately

**Bug Fixes:**
- Fixed callback dependency order (resetTouchState defined before handlers that use it)
- Added missing error handlers in ContactTextureHelper, RemindersScreen, App.js
- Push notification registration errors now logged instead of silently caught

**Files Updated:**
- `NFCRingScreen.js` - Custom URL input, read ring feature
- `nfcManager.js` - Accept custom URL for programming
- `UniverseHomeView.js`, `SolarSystemView.js` - 10 ring support
- `circlesStorage.js` - MAX_TIERS = 10
- `HomeScreen.js` - Parallel loading, race condition fix

**Note:** Update Supabase constraint: `ALTER TABLE circles DROP CONSTRAINT IF EXISTS circles_tier_check; ALTER TABLE circles ADD CONSTRAINT circles_tier_check CHECK (tier >= 1 AND tier <= 10);`

---

### December 30, 2025 (Evening)
**Cosmic Universe Enhancements & Bug Fixes**

**3D Universe Visual Effects:**
- ✦ Pointed star burst textures (8-point stars with glowing center)
- Time-of-day themes (dawn/day/sunset/night color palettes)
- Device motion parallax depth effect
- Gravity well finger interactions (contacts attract toward touch)
- Black hole warning for neglected contacts (90+ days)
- Universe birth animation for first-time users
- Constellation lines between contacts in same circle
- Supernova celebrations on achievement unlock

**Bug Fixes:**
- Fixed Unicode surrogate pair errors when saving contacts with emoji
- Added `sanitizeUnicode` utility for all database operations
- Fixed duplicate contact key errors in CircleZoom3D and UniverseHomeView
- Fixed React Native compatibility (DataTexture instead of canvas)

**Files Updated:**
- `EnhancedStarField.js` - Star burst textures using THREE.DataTexture
- `UniverseHomeView.js` - Cosmic effects, parallax, gravity well
- `CircleZoom3D.js` - Contact deduplication
- `circlesStorage.js`, `messagesStorage.js`, `remindersStorage.js` - Unicode sanitization

---

### December 30, 2025 (Morning)
**Apple Sign In & App Store Compliance** (Joshua Bell)

- Added Apple Sign In to WelcomeScreen and CreateAccountScreen (iOS only)
- Apple Sign In is required by App Store when offering other social login options
- Added Privacy Policy (`PRIVACY_POLICY.md`)
- Added Terms of Service (`TERMS_OF_SERVICE.md`)
- Fixed bug in App.js: corrected undefined variable reference (`error` → `contactError`)
- Added app icon (`assets/icon.png`) - 1024x1024 square
- Added splash screen (`assets/splash.png`)
- Updated app.json with icon and splash configuration
- **App is now TestFlight ready!**

---

### December 21, 2025
**Major Codebase Restructure & 3D Features** (Spencer Karns + Joshua Bell)

**Codebase Reorganization:**
- Restructured entire codebase into organized folders:
  - `screens/main/`, `screens/settings/`, `screens/onboarding/`, `screens/analytics/`, `screens/contacts/`
  - `components/3d/`, `components/modals/`, `components/common/`, `components/contacts/`, `components/home/`
  - `utils/storage/`, `utils/scoring/`, `utils/notifications/`, `utils/api/`
  - `docs/` for all documentation, `supabase/migrations/` for SQL files
- Added barrel exports (`components/index.js`, `screens/index.js`) for cleaner imports
- Fixed 16+ broken import paths after restructure

**New 3D Features:**
- `SolarSystemView.js` - Multi-ring 3D visualization of all circles as orbiting planets
- `PersonSphereView.js` - 3D contact focus view with photo-mapped sphere and data orbs
- `PathAnimation.js` - Animated "6 degrees of connection" path visualization
- `StarField.js` - Parallax star background with depth layers
- `TouchController.js` & `CameraController.js` - Smooth gesture handling and camera transitions

**New Components:**
- `GoalInputModal.js` - Goal planning (Job, Cofounder, Mentor, Dating)
- `AISuggestionCard.js` - AI-powered conversation starters
- `SearchBar.js` - Contact search functionality
- `HomeHeader.js`, `HealthSummaryCard.js`, `DeleteCircleModals.js`

**New Integrations (Scaffolded):**
- `lib/exa.js` - Exa AI people search integration
- `utils/api/pingAI.js` - AI conversation suggestions via Supabase edge functions

**Documentation:**
- Added product vision docs in `docs/vision/`
- Added implementation plans in `plans/`
- Added Jest testing setup with unit tests

---

### December 16, 2025 (Evening)
**Analytics, Gamification & Notifications**

New Features:
- Analytics dashboard with activity tracking and health snapshots
- Gamification system with streaks and achievements
- Reminders system for follow-ups and birthdays
- Notification preferences screen
- Health scoring and relationship status tracking
- Contact details with notes, tags, and custom dates

New Screens:
- `DashboardScreen.js` - Analytics overview
- `GamificationScreen.js` - Streaks and achievements
- `AchievementsScreen.js` - Achievement badges
- `RemindersScreen.js` - Manage reminders

New Components:
- `HealthIndicator.js`, `NetworkHealthScore.js`, `CircleHealthBreakdown.js`
- `StreakCard.js`, `AchievementCard.js`, `WeeklyActivityCard.js`
- `ReminderCard.js`, `AddReminderModal.js`, `EditContactModal.js`
- `CelebrationModal.js`, `Confetti.js`, `Skeleton.js`

Database Migrations (Supabase):
- Phase 3: `relationship_health`, `alerts`, `alert_history`
- Phase 4: `activity_log`, `health_snapshots`, `contact_dates`, `reminders`
- Phase 5: `user_streaks`, `user_achievements`
- Phase 6: `notification_preferences`

---

### December 16, 2025 (Morning)
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
**✅ Apple Sign In is ready** - native iOS authentication
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

## App Store Review Checklist

**Legal (live on getping.today):**
- Privacy Policy: https://getping.today/privacy
- Terms of Service: https://getping.today/terms
- Local copies: `PRIVACY_POLICY.md`, `TERMS_OF_SERVICE.md`

**Auth (tested & working):**
- Sign in with Apple (native SDK, button first per HIG)
- Google Sign-In (Supabase OAuth, client ID `883735243677-us7b...`)

**UGC Moderation:**
- Report User: ChatScreen → ActionSheet → `reports` table
- Block User: ChatScreen → ActionSheet → `blocked_users` table

**Account Management:**
- Delete Account: Settings → Profile → Delete Account (edge function)

## Assets (included)
- `assets/icon.png` - App icon (1024x1024)
- `assets/splash.png` - Splash screen

Both are already configured in `app.json`.
