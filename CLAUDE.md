# Ping Mobile App - Claude Context

> This file is auto-loaded by Claude Code. It provides context for all coding tasks.

---

## Quick Reference

**What is Ping?** A network visualization app. Users see their contacts as planets orbiting in a 3D solar system.

**Core Priority:** Visualize your network beautifully. Everything else serves this.

**Tech Stack:**
- React Native + Expo SDK 54
- Three.js via expo-three / expo-gl
- Supabase (PostgreSQL + Auth)
- JavaScript (no TypeScript)

**Terminology:**
- Rings = Groups of contacts (family, friends, work)
- Contacts = Planets/spheres in the 3D view
- Nucleus = Center of the solar system (user's profile)

---

## Vision Documents (READ THESE FOR CONTEXT)

| Document | When to Read |
|----------|--------------|
| `docs/vision/3D_TARGET_SPEC.md` | ALL 3D work - camera, animations, lighting |
| `docs/vision/APP_VISION.md` | UX decisions, feature priorities, what to build |
| `docs/vision/PRODUCT_VISION.md` | Full product context, future features |

**Key Rule:** Build toward the VISION, not just current state.

---

## Known Issues (Priority Fixes)

1. **3D animations** - Not smooth enough, need GSAP with power3.inOut
2. **Contact import** - Broken, friction in flow
3. **Ring assignment** - Doesn't work well
4. **Data persistence** - Things disappear, circles don't save

---

## File Location Map

### Screens
| Type | Location | Naming |
|------|----------|--------|
| Onboarding | `screens/onboarding/` | `*Screen.js` |
| Main app | `screens/main/` | `*Screen.js` |
| Settings | `screens/settings/` | `*Screen.js` |
| Analytics | `screens/analytics/` | `*Screen.js` |
| Contacts | `screens/contacts/` | `*Screen.js` |

### Components
| Type | Location | Naming |
|------|----------|--------|
| 3D/Three.js | `components/3d/` | PascalCase |
| Modals | `components/modals/` | `*Modal.js` |
| Home-specific | `components/home/` | PascalCase |
| Contact-related | `components/contacts/` | PascalCase |
| Shared/common | `components/common/` | PascalCase |
| Communication | `components/communication/` | PascalCase |
| Goals | `components/goals/` | PascalCase |

### Utilities
| Type | Location | Naming |
|------|----------|--------|
| Database ops | `utils/storage/` | `*Storage.js` |
| Health/analytics | `utils/scoring/` | `*Scoring.js` |
| Push notifications | `utils/notifications/` | `*Notifications.js` |
| API calls | `utils/api/` | camelCase.js |
| General | `utils/` | camelCase.js |

### Key Files
| Purpose | Location |
|---------|----------|
| Supabase client | `lib/supabase.js` |
| App entry | `App.js` |
| Contexts | `contexts/` |
| Migrations | `supabase/migrations/` |

---

## Code Patterns

### Import Order
```javascript
// 1. React and React Native
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

// 2. Navigation
import { useFocusEffect } from '@react-navigation/native';

// 3. Expo modules
import { GLView } from 'expo-gl';
import * as THREE from 'three';

// 4. Third-party
import { Ionicons } from '@expo/vector-icons';

// 5. Internal components
import SomeComponent from '../../components/SomeComponent';

// 6. Internal utilities
import { someFunction } from '../../utils/storage/someStorage';
import { supabase } from '../../lib/supabase';
```

### Screen Component Template
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SomeScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data when screen focused
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => { /* cleanup */ };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
```

### Storage Module Pattern
```javascript
import { supabase } from '../../lib/supabase';
import { sanitizeUnicode } from './sanitizeUnicode';

export async function loadSomething(userId) {
  try {
    console.log('[LOAD SOMETHING] Starting for userId:', userId);

    if (!userId) {
      console.error('[LOAD SOMETHING] Missing userId');
      return { success: false, error: 'Missing userId', data: [] };
    }

    const { data, error } = await supabase
      .from('table_name')
      .select('columns')
      .eq('user_id', userId);

    if (error) {
      console.error('[LOAD SOMETHING] Error:', error);
      throw error;
    }

    console.log('[LOAD SOMETHING] Success:', data?.length || 0);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[LOAD SOMETHING] Failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), data: [] };
  }
}
```

### Key Conventions
- **Logging:** Always use `[OPERATION NAME]` prefix
- **Returns:** Always `{ success, error?, data? }` from async functions
- **Unicode:** Use `sanitizeUnicode()` for all DB strings
- **Loading:** Always include loading states with timeouts (15s max)

---

## Color Palette

```javascript
// Backgrounds
DEEP_SPACE: '#0A0A0F'
SUBTLE_NAVY: '#0D0D1A'
PITCH_BLACK: '#020208'

// Primary
PRIMARY_GREEN: '#4FFFB0'
TEAL: '#4ECDC4'
TEAL_SECONDARY: '#00D4AA'

// Status (Health)
HEALTHY: '#4FFFB0'     // Green
COOLING: '#FFAA00'     // Amber
AT_RISK: '#FF6B6B'     // Red
COLD: '#FF6B6B'        // Red pulsing

// UI
TEXT_PRIMARY: '#FFFFFF'
TEXT_SECONDARY: '#A0A0A0'
TEXT_MUTED: '#666666'
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `circles` | Ring definitions (name, tier, user_id) |
| `circle_members` | Contact-to-ring mapping |
| `imported_contacts` | Phone contacts |
| `relationship_health` | Health scores |
| `alerts` | Health alerts |
| `reminders` | Follow-up reminders |
| `messages` | In-app messaging |
| `user_streaks` | Gamification |
| `user_achievements` | Achievement tracking |

---

## 3D System Overview

### Current Components
- `UniverseHomeView` - Main 3D canvas (2000+ lines)
- `EnhancedStarField` - Parallax stars
- `NebulaSystem` - Background clouds
- `NucleusGlow` - Center element
- `ContactTextureHelper` - Photo textures
- `PlanetZoom3D` - Single contact view
- `CircleZoom3D` - Single ring view

### Target State (from 3D_TARGET_SPEC.md)
- Two-state camera: SYSTEM_VIEW ↔ CONTACT_FOCUS
- GSAP animations with power3.inOut, 1.5s duration
- Point light at (0,0,0) for dramatic shadows
- Contact fills 60% of screen when focused

---

## Do Not Change

### Critical Files
- `lib/supabase.js` - Supabase client init
- `utils/storage/sanitizeUnicode.js` - Required for all DB strings
- `App.js` navigation structure (add to, don't reorganize)

### Conventions to Maintain
- Deep space black (#0A0A0F) as primary background
- Green (#4FFFB0) as primary accent
- `[OPERATION NAME]` logging prefix
- `{ success, error, data }` return pattern

---

## Common Tasks

### Adding a New Screen
1. Create in `screens/[type]/` folder
2. Follow screen component template
3. Add to navigation in `App.js`
4. Use `useFocusEffect` for data loading

### Adding a New Component
1. Create in `components/[type]/` folder
2. Use PascalCase naming
3. StyleSheet at bottom of file

### Adding a Storage Function
1. Create in `utils/storage/[name]Storage.js`
2. Follow storage module pattern
3. Include `[OPERATION]` logging
4. Return `{ success, error?, data? }`

### Working on 3D
1. **Read `docs/vision/3D_TARGET_SPEC.md` first**
2. Follow the Apple Astronomy spec
3. Use GSAP for camera animations
4. power3.inOut easing, 1.5s duration
