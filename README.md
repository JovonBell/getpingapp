# ping! (iOS / Expo)

A relationship management app that helps you stay connected with the people who matter most. Track your circles, maintain relationship health, and never forget to reach out.

## Features

- **Circles** - Organize contacts into customizable tiers (Inner Circle, Close Friends, etc.)
- **3D Visualization** - Interactive planet/circle view of your network
- **Relationship Health** - Track how well you're maintaining each relationship
- **Reminders** - Set follow-up reminders for birthdays, check-ins, and more
- **Gamification** - Earn streaks, achievements, and track your engagement
- **Analytics Dashboard** - See your weekly activity and network health trends
- **Push Notifications** - Get reminded to reach out to contacts
- **Google OAuth** - Simple sign-in with your Google account

## Changelog

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
