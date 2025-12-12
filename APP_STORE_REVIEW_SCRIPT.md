## App Store review script (run this before submitting)

### Build prerequisites
- Supabase migrations applied (Phase 1 + Phase 2 files in repo)
- Supabase Apple provider configured
- Edge Function deployed: `delete-account`
- EAS projectId set in `app.json` (`expo.extra.eas.projectId`)

### Manual QA flow (fresh install)
1. **Launch app**
   - Expect: Welcome screen with Sign in with Apple button
2. **Sign in**
   - Expect: moves into onboarding automatically (auth-gated navigation)
3. **Onboarding**
   - Expect: animations smooth, no horizontal swipe transitions
4. **Contacts import**
   - Tap import → permission prompt appears (iOS)
   - Deny → app should recover (go back or show guidance)
   - Allow → list loads; select some; import → confirmation screen
5. **Home**
   - Expect: empty orbit if no circles yet
   - Tap nucleus → Create first circle flow
6. **Create circle**
   - Select contacts → Name circle → Create
   - Expect: circle persists after kill/relaunch (loads from Supabase)
7. **3D sphere view**
   - Tap a dot → 3D opens full-screen
   - Swipe left/right to change focus
   - Close returns with no lingering popups
8. **Messaging**
   - Only contacts with `matchedUserId` can message
   - Send message → appears in thread
   - Receiver gets push notification (physical device)
   - Unread badge count updates
9. **Profile**
   - Edit profile → save → persists and reloads
10. **Delete account**
   - Profile Settings → Delete Account
   - Confirm → account is deleted (Edge Function) and app returns to Welcome

### Content/metadata checks
- No placeholder fake “John Doe” data or dummy messages/alerts shipped
- Legal links work (Privacy Policy / Terms)
- Contact support opens email client
- Permissions strings present in `app.json` infoPlist for iOS


