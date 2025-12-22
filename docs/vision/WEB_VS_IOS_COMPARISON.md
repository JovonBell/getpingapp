# Web App vs iOS App Comparison

## Architecture Overview

| Aspect | Web App (getping) | iOS App (getpingapp) |
|--------|-------------------|----------------------|
| Framework | Vite + React + TypeScript | Expo (React Native) |
| 3D Library | Three.js (full) | Expo GL + Three.js (limited) |
| UI Components | shadcn/ui + Tailwind | Custom React Native |
| Database | Supabase (shared) | Supabase (shared) |
| Styling | Tailwind CSS | StyleSheet (RN) |

**Same DB = synced users, contacts, circles, health scores**

---

## Features in Web App NOT in iOS App

### 1. **Network3D.tsx** (2523 lines!)
Full Three.js 3D visualization with:
- Interactive globe/solar system view
- Drag-and-drop contact movement between circles
- Zoom-based detail levels (zoom in = more info)
- Contact focus popup on click
- Health-based sphere coloring
- Dynamic circle management
- Person bio generation on hover

**iOS has:** Basic SVG circles with rotation. No true 3D, no drag-drop.

### 2. **AI Question Generation** (Supabase Functions)

```
generate-ping-question/     → Personalized 1-on-1 conversation starters
generate-chat-questions/    → PING! Core Agent with:
                              - L1 Discovery / L2 Bridge / L3 Catalyst levels
                              - Noise-level awareness (loud room = shorter Qs)
                              - Time budget awareness
                              - Red zone topic avoidance
                              - Commonality/complement detection
network-assistant/          → Follow-up suggestions based on contact history
generate-person-bio/        → AI bio generation from profile data
```

**iOS has:** None of this. Just static health scoring.

### 3. **Ring Purchase Flow** (Ring.tsx)
- Ring color selection (silver/gold/black)
- Size selection (5-12)
- Quantity picker
- Stripe checkout integration
- FAQ accordion
- Pre-order system

**iOS has:** Nothing. Users need separate app to encode NFC chip.

### 4. **Events Integration** (Events.tsx)
- Eventbrite API integration
- Location-based event discovery
- Interest-based recommendations
- Event attendance tracking
- "See who's going" feature

**iOS has:** None.

### 5. **Public Profile System**
- `/ping/:userId` public shareable profiles
- Profile view tracking
- "Save Contact" button for non-users
- QR code generation
- vCard export

**iOS has:** Basic profile view, no public sharing.

### 6. **Chat System** (Real-time)
- User-to-user messaging
- Real-time message updates
- Unread counts
- Chat from profile/network view

**iOS has:** Basic chat screen exists but less polished.

### 7. **Google Contacts Import**
- OAuth flow for Google Contacts
- Bulk import with deduplication
- Contact sync button

**iOS has:** Apple Contacts only (native).

### 8. **LinkedIn OAuth** (supabase function)
- LinkedIn profile import
- Work history enrichment

**iOS has:** None.

### 9. **ManageCirclesDrawer**
- Create/edit/delete circles
- Circle color picker
- Drag contacts between circles
- Unsorted contacts bucket

**iOS has:** Basic circle management, no drag-drop, no colors.

### 10. **RecommendedPingsSidebar**
- AI-powered "who to ping" suggestions
- Health-based priority
- One-click message

**iOS has:** Health alerts but no AI recommendations.

---

## Features in iOS App NOT in Web App

### 1. **Native Contact Import**
- Direct Apple Contacts access
- Phone number hashing for matching
- Native permissions handling

### 2. **Push Notifications**
- Daily digest
- Streak warnings
- Reminder notifications
- Birthday alerts

### 3. **Offline Support**
- Local storage caching
- Works without network

### 4. **Native Navigation**
- Bottom tab bar
- Native stack navigation
- Gesture-based back

### 5. **App Store Presence**
- Discoverable on App Store
- Native app feel

---

## Supabase Edge Functions (Web has, iOS doesn't use)

| Function | Purpose | iOS Status |
|----------|---------|------------|
| `generate-ping-question` | AI conversation starters | Not called |
| `generate-chat-questions` | PING! Core Agent questions | Not called |
| `network-assistant` | Follow-up suggestions | Not called |
| `generate-person-bio` | AI bio from profile | Not called |
| `fetch-eventbrite-events` | Event discovery | Not called |
| `linkedin-oauth` | LinkedIn import | Not called |
| `google-contacts-import` | Google contacts | Not called |
| `extract-contact-from-image` | OCR business card scan | Not called |
| `calculate-health-scores` | Server-side health calc | iOS does locally |
| `vcard` | Generate vCard for contact | Not called |
| `share-contacts` | Share contact list | Not called |

---

## Database Tables (Shared)

Both apps use the same Supabase:
- `profiles` - User profiles
- `circles` - Ring definitions
- `circle_members` - Contact-to-ring mapping
- `imported_contacts` - Phone contacts
- `connections` - User-to-user connections
- `messages` - In-app messaging
- `conversations` - Chat threads
- `relationship_health` - Health scores
- `alerts` - Health alerts
- `reminders` - Follow-up reminders
- `user_streaks` - Gamification
- `user_achievements` - Badges
- `notification_preferences` - Push settings

---

## Priority Features to Port to iOS

### Critical (Blocks vision)
1. **AI Question Generation** - The "Reece superpower"
2. **Full 3D Network View** - Solar system navigation
3. **Ring Purchase/Setup Flow** - Hardware integration

### High Priority
4. **Events Integration** - Growth beyond phone contacts
5. **Public Profile + QR** - NFC tap destination
6. **ManageCirclesDrawer** - Circle customization with colors

### Medium Priority
7. **Google/LinkedIn Import** - More data sources
8. **RecommendedPingsSidebar** - AI suggestions
9. **Business Card OCR** - Add contacts from photos

---

## Technical Notes

### 3D Rendering
Web uses full Three.js with:
- `OrbitControls` for camera
- Custom sphere meshes per contact
- Label sprites for names
- Raycasting for click detection
- Animation loop at 60fps

iOS would need:
- `expo-gl` + `expo-three`
- Simplified geometry (mobile GPU)
- Touch gesture handling
- Memory management for large networks

### AI Integration
Web calls edge functions via `supabase.functions.invoke()`.
iOS can do the same - just needs to add the calls.

### Ring Setup
Web has full checkout flow but iOS needs:
- NFC write capability (`react-native-nfc-manager`)
- Deep link from ring tap to profile
- Encode user's profile URL to NFC chip

---

## Three.js Feasibility on iOS/Expo

### Current State: ALREADY WORKING

The iOS app **already has Three.js integrated** and working:

```json
// package.json dependencies (already installed)
"expo-gl": "~16.0.9",
"expo-three": "^8.0.0", 
"three": "^0.166.1"
```

**Existing 3D components:**
- `CircleZoom3D.js` (869 lines) - Full 3D ring view with orbiting contacts
- `PlanetZoom3D.js` (1095 lines) - 3D contact detail with swipeable carousel

### What Works Well (Easy to Port)

| Feature | Difficulty | Notes |
|---------|------------|-------|
| Basic sphere rendering | Done | Already implemented |
| Orbit controls (drag to rotate) | Done | PanResponder + angle interpolation |
| Pinch to zoom | Done | Multi-touch gesture handling |
| Contact spheres on rings | Done | Color-coded by health |
| Smooth animations | Done | requestAnimationFrame loop |
| Raycasting (tap detection) | Done | THREE.Raycaster working |
| Label sprites | Medium | Currently using React overlays |

### What's Harder (Needs Work)

| Feature | Difficulty | Challenge |
|---------|------------|-----------|
| **Multi-ring solar system** | Medium | Need to composite multiple orbits at different radii |
| **Drag-drop between rings** | Hard | Need 3D position → ring mapping + state management |
| **2500+ line Network3D port** | Hard | Major refactor, web uses OrbitControls (not available) |
| **Dynamic circle colors** | Easy | Just pass color to material |
| **Health-based glow** | Medium | Need emissive materials + bloom (expensive on mobile) |
| **Mini-bubbles on spheres** | Medium | Nested geometry or texture mapping |
| **Connection path lines** | Easy | THREE.Line already used |
| **Tentative/ghosted bubbles** | Easy | Opacity + dashed materials |

### Performance Considerations

**Mobile GPU Limitations:**
- Keep polygon count low (SphereGeometry segments: 16-32, not 64)
- Limit draw calls (batch similar geometries)
- No post-processing (bloom, SSAO) without significant FPS drop
- Max ~100-200 spheres before frame drops

**Memory:**
- Dispose geometries/materials on unmount (already done)
- Use instanced rendering for many similar objects
- Texture atlasing for contact photos

### Technical Approach

**Option A: Extend Existing Components (Recommended)**
1. Modify `CircleZoom3D.js` to support multiple rings
2. Add drag-drop with gesture state machine
3. Incrementally add features (glow, paths, etc.)
4. Keep web Network3D as reference, don't port directly

**Option B: Port Network3D.tsx**
- 2523 lines of web-specific code
- Uses `OrbitControls` (not available in expo-three)
- DOM-based label positioning (not applicable)
- Would need 60-70% rewrite

### Recommendation

**Extend existing components.** You already have:
- Working 3D rendering pipeline
- Touch gesture handling
- Animation loop
- Raycasting

The web's `Network3D.tsx` is heavily web-specific. Better to use it as a **design reference** while building native-first.

### Priority Implementation Order

1. **Multi-ring rendering** - Add concentric orbits to CircleZoom3D
2. **Solar system view** - New component that shows all rings together
3. **Tap → zoom transition** - Animate from overview to single ring
4. **Drag-drop** - Gesture recognition for moving contacts
5. **Visual polish** - Glow, paths, tentative states
