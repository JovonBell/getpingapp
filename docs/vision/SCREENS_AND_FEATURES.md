# Ping! Screens & Features Spec

## New Codebase Structure

```
screens/
  onboarding/     # WelcomeScreen, CirclesExplainer, ImportContacts, etc.
  main/           # HomeScreen, AlertsScreen, ChatScreen, MessagesScreen
  contacts/       # ContactsListScreen, AddContactScreen
  settings/       # ProfileScreen, SettingsScreen, Privacy, Notifications, etc.
  analytics/      # DashboardScreen, GamificationScreen, AchievementsScreen

components/
  home/           # HomeHeader, HealthSummaryCard, SearchBar, DeleteCircleModals
  contacts/       # CircleZoom3D, PlanetZoom3D, HealthIndicator
  modals/         # AddContactModal, EditContactModal, AddReminderModal
  common/         # Skeleton, Confetti, GestureHint

utils/
  storage/        # All *Storage.js files (circles, contacts, alerts, etc.)
  scoring/        # healthScoring.js, analyticsCalculations.js
  notifications/  # pushNotifications.js
```

---

## Current Screens (Implemented)

### Onboarding Flow
| Screen | Purpose | Status |
|--------|---------|--------|
| WelcomeScreen | Sign in (Google OAuth) | Done |
| CreateAccountScreen | Account creation | Done |
| WelcomeIntroScreen | App introduction | Done |
| CirclesExplainerScreen | Explain ring concept | Done |
| BuildUniverseScreen | Setup visualization | Done |
| ImportContactsScreen | Import from phone | Done |
| SelectContactsScreen | Choose contacts for ring | Done |
| VisualizeCircleScreen | Name and preview ring | Done |
| ImportConfirmationScreen | Confirm import | Done |
| FirstCircleCelebrationScreen | Celebration moment | Done |

### Main App
| Screen | Purpose | Status |
|--------|---------|--------|
| HomeScreen | Ring visualization, rotate/zoom | Done |
| AlertsScreen | "Pings!" - health alerts | Done |
| ContactsListScreen | List view of contacts | Done |
| SettingsScreen | App settings | Done |

### Contact Interaction
| Screen | Purpose | Status |
|--------|---------|--------|
| PlanetZoom3D | 3D contact card, actions | Done |
| CircleZoom3D | View single ring in 3D | Done |
| AddContactScreen | Add new contact | Done |
| ChatScreen | Messages (text-based) | Done |
| MessagesScreen | Conversation list | Done |

### Profile & Settings
| Screen | Purpose | Status |
|--------|---------|--------|
| ProfileScreen | View profile | Done |
| ProfileEditScreen | Edit profile | Done |
| ProfileSettingsScreen | Profile settings | Done |
| PrivacySettingsScreen | Privacy controls | Done |
| NotificationsSettingsScreen | Notification prefs | Done |
| ThemeSettingsScreen | Theme selection | Done |
| LanguageSettingsScreen | Language | Done |

### Analytics & Gamification
| Screen | Purpose | Status |
|--------|---------|--------|
| DashboardScreen | Analytics overview | Done |
| GamificationScreen | Streaks, progress | Done |
| AchievementsScreen | Achievement badges | Done |
| RemindersScreen | Follow-up reminders | Done |

### Support
| Screen | Purpose | Status |
|--------|---------|--------|
| HelpCenterScreen | Help docs | Done |
| ContactUsScreen | Support contact | Done |
| AboutScreen | About the app | Done |
| AccountDeletionScreen | Delete account | Done |
| DiagnosticsScreen | Debug info | Done |

---

## Vision: 3D-First Integrated Experience

The app is NOT a collection of separate screens. It's an **interactive 3D solar system** where everything flows spatially.

### Core Metaphor: Solar System
- Your network = solar system
- Rings = orbits (user-defined meaning: family, friends, professional, etc.)
- Connections = bubbles/spheres floating on each ring
- Data = dots/mini-bubbles ON each person's sphere (memories, interactions, shared context)

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     3D SOLAR SYSTEM VIEW                        │
│                                                                 │
│    Zoom out: See all rings, all connections as spheres          │
│    Zoom in: Focus on single ring, see person details            │
│    Tap bubble: Smooth 3D zoom into person → Communication view  │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐     │
│    │  Each person bubble has:                            │     │
│    │  • Semi-transparent sphere                          │     │
│    │  • Dots/mini-bubbles = data points about them       │     │
│    │    - MCP data (LinkedIn, calendar, email)           │     │
│    │    - Shared interactions                            │     │
│    │    - Memories/notes                                 │     │
│    │    - Health indicators                              │     │
│    │  • Connection strength = bubble opacity/glow        │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                 │
│    AI Agent = built into main interaction (not a screen)        │
│    • Always available via voice/text input                      │
│    • Triggers agentic work in background                        │
│    • Results visualized in 3D (paths appear, connections glow)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Goal-Setting Flow (3D Animation, Not Separate Screen)

1. **Tell the agent your goal** (voice or type)
   - "I want to reach the CEO of Runway"
   - "I'm looking for a cofounder in AI"

2. **Agent places target on the system**
   - New ring or existing ring
   - Visual indicator: tentative/not-yet-connected (dotted line, ghosted bubble)

3. **Voice/type your intentions**
   - Why this connection?
   - What value can you provide?

4. **Agent triggers Poke-style agentic work**
   - Decides: direct connection possible? Or need 1-2-3 intermediary connections?
   - Maps path through existing network
   - **Visualized in 3D**: path lights up through your rings

5. **Execute the path**
   - At each step (intermediary or final), Ping AI crafts "brilliant ass shit to say"
   - Question suggestions, outreach drafts, timing recommendations

### Communication Flow (3D Zoom Transition)

```
Tap person bubble
      ↓
3D zoom animation (smooth, spatial)
      ↓
Communication view takes over screen
      ↓
┌─────────────────────────────────────────┐
│  [Person's face/avatar - large]         │
│                                         │
│  AI suggestions (built-in, not modal):  │
│  • "Ask about their Runway research"    │
│  • "Mention your shared MIT connection" │
│  • "Their birthday was last week"       │
│                                         │
│  [Video] [Voice] [Text]                 │
│                                         │
│  Recent interactions timeline           │
│  MCP data dots expanded                 │
└─────────────────────────────────────────┘
```

### What is NOT a Separate Screen

| Old Idea | New Approach |
|----------|--------------|
| PingAgentScreen | Built into main interaction - always available |
| ConversationStarterScreen | Suggestions appear contextually when viewing a person |
| InsightsFeedScreen | Insights surface as notifications + visual cues on bubbles |
| ConnectionPathScreen | Animated 3D visualization when planning a goal |
| GoalTaggingScreen | Voice/text modal when setting intentions |

### What IS a Separate Screen

| Screen | Purpose | Transition |
|--------|---------|------------|
| **CommunicationScreen** | Video/voice/text messaging | 3D zoom from person bubble |
| **RingSettingsScreen** | Configure ring weights, scoring | Settings flow or long-press ring |
| **HardwareSetupScreen** | Pair NFC ring | Onboarding/settings |

---

## RingSettingsScreen Design

**Access:** Long-press a ring in 3D view OR Settings > Rings > [Ring Name]

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                    [Delete Ring]        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │     ◯◯◯  "Inner Circle"  ◯◯◯                            │   │
│  │         12 connections                                   │   │
│  │    [Mini 3D preview of ring with bubbles rotating]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RING IDENTITY                                                  │
│                                                                 │
│  Name                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Inner Circle                                        ✎   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Ring Type                               What kind of people?   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Family │ │Friends │ │  Work  │ │ Dating │ │ Custom │        │
│  │   ✓    │ │        │ │        │ │        │ │        │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  HEALTH SCORING                         How should we measure?  │
│                                                                 │
│  Contact Frequency Weight                                       │
│  Less important ○───────●───○ Very important                    │
│                                                                 │
│  Interaction Depth Weight              (video > voice > text)   │
│  Less important ○───●───────○ Very important                    │
│                                                                 │
│  Reciprocity Weight                    (who initiates more)     │
│  Less important ○─────────●─○ Very important                    │
│                                                                 │
│  Decay Rate                            How fast does health drop │
│  Slow decay ○───────●───────○ Fast decay                        │
│                                                                 │
│  Target Contact Frequency                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Weekly  ▼                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  (Daily | Weekly | Bi-weekly | Monthly | Quarterly | Yearly)    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  APPEARANCE                                                     │
│                                                                 │
│  Ring Color                                                     │
│  ● Green  ○ Blue  ○ Purple  ○ Gold  ○ Red  ○ Custom            │
│                                                                 │
│  Bubble Style                                                   │
│  ○ Solid  ● Semi-transparent  ○ Wireframe                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  NOTIFICATIONS                                                  │
│                                                                 │
│  Health Alerts                                     [Toggle ON]  │
│  Notify when connection health drops below 30%                  │
│                                                                 │
│  Milestone Reminders                               [Toggle ON]  │
│  Birthdays, anniversaries, important dates                      │
│                                                                 │
│  AI Suggestions                                    [Toggle ON]  │
│  Get "Reece superpower" question suggestions                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  MEMBERS                                              See All → │
│                                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │  👤  │ │  👤  │ │  👤  │ │  👤  │ │ +12  │                  │
│  │ Alex │ │ Sam  │ │ Mom  │ │ Dad  │ │ more │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                                 │
│                        [Save Changes]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ring Type Presets

Each ring type has default scoring weights:

| Type | Frequency | Depth | Reciprocity | Decay | Target |
|------|-----------|-------|-------------|-------|--------|
| **Family** | Low | High | Low | Slow | Monthly |
| **Friends** | Medium | High | Medium | Medium | Weekly |
| **Work** | High | Medium | High | Fast | Weekly |
| **Dating** | Very High | Very High | Very High | Very Fast | Daily |
| **Custom** | User-defined | User-defined | User-defined | User-defined | User-defined |

### Interaction States

**Long-press ring in 3D view:**
- Ring pulses/highlights
- Tooltip appears: "Settings" | "Add Person" | "View All"
- Tap "Settings" → smooth transition to RingSettingsScreen

**Delete Ring:**
- Confirmation modal: "Delete 'Inner Circle'? 12 connections will be moved to Uncategorized."
- Option to move to another ring instead

**Ring Type Selection:**
- Tapping a type auto-fills the scoring weights with presets
- User can still customize after selecting type
- "Custom" starts with balanced defaults

---

## Planned Features (Vision)

### Ring/Bubble Enhancements
| Feature | Description | Priority |
|---------|-------------|----------|
| MCP data dots | Each data source = dot on person's sphere | Critical |
| Interaction history | Mini-bubbles inside semi-transparent sphere | Critical |
| Health glow | Connection strength = visual intensity | High |
| Tentative connections | Ghosted/dotted for goals not yet reached | High |
| Multi-axis rotation | Spherical navigation, not just single axis | Medium |

### AI Integration (Built-In)
| Feature | Description | Priority |
|---------|-------------|----------|
| Always-on voice input | Speak to agent anytime | Critical |
| Goal-to-path planning | Agent maps connection path, visualized in 3D | Critical |
| Contextual suggestions | "Reece superpower" questions appear on person view | Critical |
| Proactive insights | Bubbles glow/pulse when agent has suggestions | High |
| Outreach crafting | AI drafts messages based on goal + context | High |

### Communication
| Feature | Description | Priority |
|---------|-------------|----------|
| Video messages | 60-sec max, Snapchat-style | Critical |
| Voice messages | With waveform, transcription | High |
| AI-assisted drafts | Agent suggests what to say/ask | High |
| Rich previews | Link previews in messages | Medium |

### Hardware
| Feature | Description | Priority |
|---------|-------------|----------|
| NFC ring pairing | Connect physical ring to app | Critical |
| Tap-to-add contact | Ring tap → instant connection | Critical |
| Ring-to-ring handshake | Two rings shake hands → auto-connect + "ping!" | Future (patent pending) |

---

## Feature Specifications

### Compound Health Scoring

**Current:** Linear decay based on days since contact

**Proposed:** Multi-factor compound score

```
Base Variables:
- days_since_contact
- interaction_frequency
- interaction_depth (text vs voice vs video vs IRL)
- reciprocity (who initiates more)
- goal_progress (if goal-tagged)

Relationship Type Modifiers:
- Professional: weight career relevance, mutual benefit
- Personal: weight emotional connection, shared experiences  
- Romantic: weight attention, responsiveness, progression
- Family: weight obligation, milestone attendance
- Strategic: weight proximity to goals, connection value
```

### Goal Tagging System

When connecting, user must specify:
1. **Goal Type:** Job, Cofounder, Friend, Romantic, Strategic, etc.
2. **Intention Message:** Why you want to connect
3. **Timeline:** Urgent, Near-term, Long-term, Evergreen
4. **Success Criteria:** What would make this connection valuable

### Video/Voice Messaging

Requirements:
- Max 60 second videos (Snapchat-style)
- Voice messages with waveform visualization
- Read/viewed receipts
- Expiring messages option
- Save to camera roll option

### AI Agent Features

Core capabilities:
1. **Memory:** Remember past interactions, preferences, goals
2. **Question Generation:** Suggest conversation starters
3. **Connection Mapping:** Identify paths to targets
4. **Outreach Crafting:** Draft personalized messages
5. **Timing Suggestions:** When to reach out
6. **Insight Synthesis:** "You and X both know Y, and share interest in Z"

---

## Three.js Visualization Upgrades

### Current
- 2D SVG rings with rotation
- Single axis rotation
- Contact nodes on rings

### Proposed
- Full 3D sphere
- Multi-axis rotation (spherical navigation)
- Depth/layering for ring proximity
- Particle effects for connection strength
- Animated connection lines
- Gravity-based clustering

---

## Data Sources Needed

| Source | Purpose | MCP Available? |
|--------|---------|----------------|
| LinkedIn | Professional network, employment | TBD |
| Apple Contacts | Phone contacts, relationships | Native |
| Calendar | Meeting history, frequency | TBD |
| Email | Communication patterns | TBD |
| Twitter/X | Interests, public connections | TBD |
| Deep Web Search | People enrichment | TBD |
| Location | Event attendance, proximity | Native |

---

## Design Principles

1. **Intentionality over Volume** - Every connection should have purpose
2. **Quality over Quantity** - Better to have 50 strong connections than 500 weak ones
3. **Action over Visualization** - Seeing your network is step 1, acting on it is the goal
4. **Human over Bot** - AI assists, doesn't replace genuine interaction
5. **Moment over Message** - Create memorable interactions, not just touchpoints
