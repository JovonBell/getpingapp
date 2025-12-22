# Ping! 3D Interface Design Specification

> For use with AI design tools (Stitch, Figma AI, etc.) to generate screen mockups

---

## CRITICAL: This is a 3D App, Not a 2D App with 3D Elements

**EVERYTHING in this app happens in a Three.js 3D scene.** 

### What This App Is NOT:
- A traditional 2D mobile app with flat cards and lists
- A 2D app that happens to have a 3D visualization widget
- Flat UI screens with 3D decorative elements

### What This App IS:
- An **immersive 3D galaxy** you navigate spatially
- Your contacts are **floating 3D spheres**, not 2D circles or cards
- Photos are **texture-mapped onto sphere surfaces**
- UI elements **float in 3D space** with glass-morphism
- Transitions are **camera movements**, not screen swaps
- The star field background is **always visible** for depth

### Visual Reminders for AI Image Generation:

**Person View = 3D Sphere, NOT 2D Card:**
```
WRONG:                          RIGHT:
┌────────────┐                  
│   ┌───┐    │                      ╭─────────────────╮
│   │ 👤│    │                  ╭───│  ┌─────────┐   │───╮
│   └───┘    │                  │   │  │  face   │   │   │  ← 3D sphere
│  "Alex"    │                  │   │  │ mapped  │   │   │    floating
│  [Card]    │                  ╰───│  │   on    │   │───╯    in space
└────────────┘                      │  │ sphere  │   │
                                    ╰──│─────────│───╯
```

**Path Finding = Animated 3D Trail, NOT Flat Diagram:**
```
WRONG:                          RIGHT:
┌───────────────┐               Particle trail traveling 
│ You → A → B   │               through 3D space between
│ [flat diagram]│               floating contact spheres
└───────────────┘               with message bubbles
```

---

## Design Philosophy

### Core Principles

1. **Smooth over Complex** - Every interaction should feel buttery. No jank, no unexpected spins, no glitches. If it can't be smooth, simplify it.

2. **Depth through Contrast** - The 3D solar system needs visual grounding. Light background elements (stars, nebula dust, subtle gradients) give rings something to exist against.

3. **Render Only What Matters** - No overcrowded rings. If a ring has 50 people, show the 8-12 most relevant (by health, recency, or AI priority) with a "+38 more" indicator.

4. **Touch-First Design** - Gestures should be obvious and forgiving. Large touch targets. Clear visual feedback. Momentum that feels natural.

5. **Information Progressive Disclosure** - Zoomed out = shapes and colors. Zoomed in = names and details. Tapped = full context.

---

## Visual Language

### Color Palette

```
Background:
- Deep space black: #0A0A0F
- Subtle navy undertone: #0D0D1A
- Star field highlights: #FFFFFF at 5-15% opacity

Rings:
- Primary green (healthy): #4FFFB0
- Warning amber: #FFAA00  
- Danger red: #FF6B6B
- Cool teal: #4ECDC4
- Custom ring colors: User-defined

Contacts/Bubbles:
- Semi-transparent spheres with colored rim glow
- Interior: 15-25% opacity of ring color
- Rim/edge: 80-100% opacity, subtle bloom

UI Elements:
- Text primary: #FFFFFF
- Text secondary: #A0A0A0
- Accent actions: #4FFFB0
- Destructive: #FF6B6B
```

### Background Treatment

**Problem:** Current design has rings floating in pure black void - no depth perception.

**Solution:** Layered background elements:

```
Layer 1 (Deepest): Subtle radial gradient from #0D0D1A center to #050508 edges
Layer 2: Distant star field - tiny dots (1-2px) at 5-10% opacity, very slow parallax
Layer 3: Nebula wisps - soft purple/blue gradients at 3-5% opacity, organic shapes
Layer 4: Closer stars - slightly larger (2-3px), 15-20% opacity, subtle twinkle
Layer 5: Your rings and contacts (foreground)
```

This creates **atmospheric depth** without distracting from the content.

---

## Screen 1: Solar System Overview (Home)

### Purpose
The main view. Your entire network as a navigable 3D solar system.

### Visual Description

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Ping! logo - top left]              [🔔] [💬] [👤] - top right│
│                                                                 │
│                    ✦  .  ·    ✦                                │
│              .  ·        ✦      .   ·                          │
│         ·                              ✦                        │
│                                                                 │
│              ╭─────────────────────╮                           │
│           ╭──│                     │──╮                        │
│         ╭─│  │    ◉ You (center)   │  │─╮                      │
│        ╭│ │  │                     │  │ │╮                     │
│       ││ │  ╰─────────────────────╯  │ ││                     │
│       ││ │     ○  ○  ○  Ring 1  ○    │ ││                     │
│       ││ ╰───○────────────────○─────╯ ││                     │
│       │╰────○──── Ring 2 ────○────────╯│                     │
│       ╰─────○────── Ring 3 ──────○─────╯                      │
│              ○                    ○                             │
│         ·          ✦      .    ·      ✦                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3 people need attention                    View All →   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  [  ◎ Circles  ]  [  🔔 Pings  ]  [  👥 Contacts  ]  [  ⚙️  ]  │
└─────────────────────────────────────────────────────────────────┘
```

### 3D Behavior

**Camera Position:** Slightly above and in front of the solar system, looking down at ~15° angle. This gives depth without being disorienting.

**Rings:** Concentric ellipses (not perfect circles) to suggest 3D perspective. Innermost ring = closest people.

**Contact Bubbles:** Semi-transparent spheres sitting ON the rings. Size consistent, but GLOW intensity varies by health:
- Healthy (80-100%): Bright, soft green glow
- Warm (50-79%): Amber glow
- Cold (20-49%): Dim, red-tinted
- Critical (<20%): Pulsing red, demands attention

**Rotation:**
- Rings rotate very slowly by default (1 full rotation per 60 seconds) - almost imperceptible but creates life
- Each ring rotates at slightly different speed (outer slower than inner)
- Touch stops rotation, drag rotates manually
- Release with velocity = momentum spin that decelerates smoothly

### Touch Interactions

| Gesture | Action | Feedback |
|---------|--------|----------|
| **Single tap on bubble** | Select contact, show quick info | Bubble pulses, info card slides up |
| **Double tap on bubble** | Zoom into Communication view | Smooth camera fly-in animation |
| **Tap on ring (not bubble)** | Select ring, highlight all its contacts | Ring glows brighter, others dim |
| **Drag anywhere** | Rotate entire system | 1:1 rotation with finger, momentum on release |
| **Pinch** | Zoom in/out | Smooth dolly, max zoom = single ring fills screen |
| **Long press on bubble** | Quick actions menu | Haptic feedback, radial menu appears |
| **Long press on ring** | Ring settings | Ring pulses, options appear |

### Touch Design Details

**Why current 3D feels buggy:** Likely issues:
1. Rotation sensitivity too high (small movements = big spins)
2. No momentum decay (stops abruptly or spins forever)
3. Conflict between tap and drag detection
4. No gesture disambiguation delay

**Our approach:**
- **50ms delay** before rotation starts (distinguishes tap from drag)
- **Velocity-based momentum** with natural deceleration curve
- **Max rotation speed cap** (can't spin faster than X degrees/second)
- **Snap-to-rest** at pleasing angles when momentum ends
- **Touch target expansion** - bubbles have 44pt minimum touch area even if visually smaller

### Content Limits

**Per ring maximum visible:** 12 contacts
- If ring has more, show top 12 by health score
- "+N more" indicator on the ring
- Tapping ring shows full list

**Total rings visible:** 6 maximum
- More rings = horizontal scroll or nested view
- Outer rings can collapse to indicators when zoomed on inner

---

## Screen 2: Ring Focus View

### Purpose
Zoomed view of a single ring. See all contacts in that ring with more detail.

### Transition
From Solar System: Tap ring → Camera smoothly flies toward that ring over 400ms, other rings fade to 20% opacity.

### Visual Description

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                    "Inner Circle"              [+ Add]  │
│                                                                 │
│              ·    ✦         .        ·    ✦                    │
│                                                                 │
│                    ╭───────────────────╮                       │
│               ╭────│    ◉ You         │────╮                   │
│            ╭──│    │   (center glow)   │    │──╮                │
│          ╭─│  │    ╰───────────────────╯    │  │─╮              │
│         ││ │  │                             │  │ ││             │
│        ││ │  │   ●       ●       ●         │  │ ││            │
│       ││ │  │  Alex    Sam     Mom         │  │ ││            │
│       ││ │  │   ●       ●       ●         │  │ ││            │
│       ││ │  │  Dad    Bestie   Bro        │  │ ││            │
│        ││ │  │                             │  │ ││             │
│         ││ ╰──│    (Ring orbit path)       │──╯ ││              │
│          ╰───│                             │───╯               │
│              ╰─────────────────────────────╯                   │
│                                                                 │
│                    ·    ✦    .    ·                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● Alex Chen                                              │   │
│  │ Last contact: 3 days ago        Health: ████████░░ 82%   │   │
│  │                                                          │   │
│  │ [💬 Message]  [📞 Call]  [⏰ Remind]  [···]              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3D Behavior

**Camera:** Positioned closer, looking at ring from slight angle. Ring fills ~70% of screen width.

**Contacts:** Now show names below bubbles (text sprites or React overlays). All contacts visible in this ring (up to ~20 before scrolling).

**Orbit Animation:** Contacts slowly orbit the center. Dragging rotates the ring to bring specific contacts into view.

**Selection:** Tapped contact rises slightly (Z-axis pop), glows brighter, and info card appears below.

### Interactions

| Gesture | Action |
|---------|--------|
| Tap bubble | Select, show info card |
| Double tap bubble | Enter Communication view |
| Drag | Rotate ring |
| Pinch out | Return to Solar System |
| Swipe down on card | Dismiss selection |
| Tap "+ Add" | Open add contact modal |

---

## Screen 3: Communication View (3D Focus on Person Sphere)

### Purpose
Focus on one person's **3D sphere** floating in space. The sphere IS the person - not a 2D card overlay.

### Transition
From Ring Focus: Double-tap contact → Camera flies TOWARD that sphere, sphere grows larger as you approach, other elements fade/blur. You end up floating in front of their sphere.

### CRITICAL: This is 3D, Not a 2D Card

**WRONG (what Stitch generated):**
- Flat 2D card with circle avatar
- White/gray card backgrounds
- Static layout

**RIGHT (what we want):**
- Person's sphere floats in 3D space, slowly rotating
- Sphere is semi-transparent with internal glow
- Their photo/avatar is MAPPED ONTO the sphere surface (texture)
- Small data orbs orbit around their sphere (MCP data points)
- Stars and depth visible behind/around the sphere
- UI elements float in 3D space, not on flat cards

### Visual Description (3D Scene)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                                              [···]      │
│                                                                 │
│         ·    ✦    .   ·        ✦    .        ·    ✦            │
│                                                                 │
│                    ╭─────────────────╮                         │
│               ╭───╱                   ╲───╮                    │
│            ╭─╱    │                   │    ╲─╮                 │
│           ╱       │    ┌─────────┐    │       ╲                │
│          │        │    │ Alex's  │    │        │               │
│          │   ·    │    │  face   │    │    ·   │  ← 3D SPHERE  │
│          │  ○     │    │ mapped  │    │     ○  │    with photo │
│          │ data   │    │   on    │    │  data  │    texture    │
│          │ orb    │    │ sphere  │    │  orb   │               │
│           ╲       │    └─────────┘    │       ╱                │
│            ╰─╲    │                   │    ╱─╯                 │
│               ╰───╲                   ╱───╯                    │
│                    ╰─────────────────╯                         │
│                           ◉                                    │
│                     (green health                              │
│                      glow at base)                             │
│                                                                 │
│              Alex Chen                                          │
│        Product Designer at Figma                                │
│     ● High Gravity    •    Last seen 2h ago                    │
│                                                                 │
│         ·    ✦    .   ·        ✦    .        ·                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✦ PING AI INSIGHT                              ✦  ✦   │   │
│  │                                                         │   │
│  │  "Ask Alex about the new variables update in Figma      │   │
│  │   based on his recent tweet."                           │   │
│  │                                                         │   │
│  │  [ ▶ Use this ]                              [ ↻ ]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                     │
│  │  📹       │ │  🎤       │ │  💬       │                     │
│  │  Video    │ │  Voice    │ │  Text     │                     │
│  └───────────┘ └───────────┘ └───────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3D Elements (MUST be rendered in Three.js)

1. **Person Sphere**
   - Semi-transparent sphere (opacity 0.7-0.8)
   - Photo/avatar mapped as texture on sphere surface
   - Slow rotation (5-10 seconds per revolution)
   - Inner glow effect (emissive material)
   - Fresnel rim lighting (brighter at edges)

2. **Data Orbs** (orbiting the person sphere)
   - Small spheres representing MCP data sources
   - LinkedIn orb, Calendar orb, Twitter orb, etc.
   - Orbit at different speeds/angles
   - Tap an orb to see that data source's info

3. **Health Indicator**
   - Glowing ring or aura at base of sphere
   - Color = health status (green/amber/red)
   - Pulse animation for attention states

4. **Background**
   - Stars visible through/around sphere
   - Subtle nebula gradients
   - The solar system is still there, just far away/blurred

### UI Overlays (Float in 3D Space)

The text and buttons should feel like they're floating in space, not on a flat card:
- Semi-transparent dark backgrounds with blur
- Subtle glow on edges
- Glass-morphism aesthetic
- Parallax movement when device tilts (optional)

---

## Screen 4: Goal Planning & Path Discovery (3D Modal Overlay)

### Purpose
Set a networking goal ("I want to reach the CEO of Runway") and watch AI map the path in real-time 3D animation.

### CRITICAL: This is NOT a Separate Screen

**WRONG (what Stitch generated):**
- Full-screen 2D form
- Flat path diagram
- Static "path found" card

**RIGHT (what we want):**
- Modal overlay floats at BOTTOM of screen (like iOS share sheet)
- 3D solar system is STILL VISIBLE and INTERACTIVE behind it
- Path animation happens IN THE 3D SCENE, not on a 2D card
- Path grows in real-time, traveling through space to each node

### Access
- Voice command or text input from any view
- Tap "+" button or use natural language: "I want to connect with..."
- Modal slides up from bottom, 3D scene remains behind

### Visual: Modal Input (Bottom Sheet Style)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Cancel                                              Save ↗   │
│                                                                 │
│       3D SOLAR SYSTEM VISIBLE HERE                              │
│       (rings, contacts, stars - all interactive)                │
│       .    ✦    .   ·        ✦    .        ·    ✦    .         │
│             ╭───────────────────────╮                           │
│          ╭──│  ○   ○   ○   ○   ○  │──╮                         │
│        ╭─│  │      ╭───────╮      │  │─╮                       │
│       ╱  │  │   ○  │  You  │  ○   │  │  ╲                      │
│         ╰─│ │      ╰───────╯      │ │─╯                        │
│           ╰─│  ○   ○   ○   ○   ○  │─╯                          │
│             ╰───────────────────────╯                           │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│  │                                                         │   │
│  │  I want to reach the CEO of Runway...                   │   │
│  │                                                  🎤 [mic]│   │
│  ├─────────────────────────────────────────────────────────│   │
│  │  GOAL TYPE                                              │   │
│  │  ○ Job  ● Cofounder  ○ Mentor  ○ Dating               │   │
│  ├─────────────────────────────────────────────────────────│   │
│  │  WHY THIS CONNECTION?                                   │   │
│  │  Add details to help the AI find the best path...       │   │
│  │                                                         │   │
│  ├─────────────────────────────────────────────────────────│   │
│  │              [ ✦ Start Path Finding ]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Visual: Path Growing Animation (LIVE 3D)

After "Find Path" tapped, the **3D scene comes alive**:

```
STAGE 1: Path Spawns from You
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ✦    .   ·        ✦    .        ·    ✦    .   ·   ✦         │
│                                                                 │
│                         Chris (CEO)                             │
│                             ◎ ← ghosted sphere,                 │
│                            ╱    pulsing outline                 │
│                           ╱                                     │
│                          ╱  (dashed line showing                │
│        Prof. Kim ──────╱    eventual path)                      │
│            ○ (glows!)                                           │
│             ╲                                                   │
│              ╲                                                  │
│               ╲                                                 │
│     Hassan ────●══════════════ PATH GROWING ═══════════▶        │
│         ○      ↑                                               │
│        ╱       │                                               │
│       ╱        Animated particle trail                         │
│      ╱         traveling through 3D space                      │
│    ◉ YOU                                                       │
│   (center, glowing)                                            │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│  │  ✦ PATH FOUND                                           │   │
│  │                                                         │   │
│  │  2-step path to Chris (Runway CEO)                      │   │
│  │                                                         │   │
│  │  Step 1: Ask Hassan for intro                           │   │
│  │  💬 "Hey Hassan, you mentioned knowing Prof. Kim..."    │   │
│  │                                                         │   │
│  │  Step 2: Prof. Kim intros Chris                         │   │
│  │  💬 "Prof Kim, I'd love to meet Chris from..."          │   │
│  │                                                         │   │
│  │              [ ✦ Start Here ]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3D Path Animation Sequence (MUST be animated in Three.js)

1. **Stage 1: Spawn** (0-0.5s)
   - Glowing particle emerges from your center sphere
   - Camera subtly pulls back to show more of the network
   
2. **Stage 2: First Hop** (0.5-1.5s)
   - Particle trail travels through 3D space to first intermediary
   - First intermediary's sphere PULSES and glows when hit
   - Small message bubble appears near that sphere showing suggested text
   
3. **Stage 3: Subsequent Hops** (1.5-3s)
   - Particle continues to each intermediary
   - Each sphere pulses on contact
   - Trail remains visible behind (like a comet tail)
   
4. **Stage 4: Target Reached** (3-4s)
   - Particle reaches target (ghosted sphere)
   - Target sphere solidifies from ghost to full opacity
   - Celebration particles burst
   - Full path glows with persistent animated energy

### Message Bubbles Along Path (3D, Not Flat)

```
Each node shows a floating message bubble:

         ╭────────────────────────────╮
         │ "Hey Hassan, remember when │ ← Semi-transparent
         │  we met at the steakhouse? │   floating in 3D
         │  I'd love to ask about..." │   near Hassan's sphere
         ╰────────────────────────────╯
                     ↓
                   ○ Hassan
```

- Bubbles are 3D planes facing camera (billboards)
- Glass-morphism effect (blur background)
- Appear sequentially as path is traced
- Can tap bubble to edit AI's suggested message

### 3D Elements (MUST be in Three.js)

1. **Path Trail**
   - Glowing line geometry with animated particles
   - Color matches your "ring" theme or goal type color
   - Thickness varies (thicker = stronger connection)
   - Particle speed = ~500px/sec for satisfying animation

2. **Target Sphere**
   - Starts as wireframe/ghosted (opacity 0.3)
   - Dashed outline pulses
   - Solidifies when path reaches it
   - Position: floats beyond your outermost ring

3. **Intermediary Glow**
   - Each hop contact gets temporary glow ring
   - Glow persists for duration of path view
   - Tap glow to see that person's details

4. **Message Bubbles**
   - 3D billboard planes (always face camera)
   - Appear with fade+scale animation
   - Semi-transparent with backdrop blur
   - Show AI-suggested outreach text

### Modal Behavior

- **Slides up** from bottom (like iOS share sheet)
- **Can drag down** to dismiss
- **3D scene behind** remains interactive
- **Tapping outside modal** dismisses it
- **Camera adjusts** to show relevant contacts when path found

---

## Screen 5: Ring Settings

### Access
Long-press on ring OR Settings > Rings > [Ring Name]

### Visual Description

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                                        [Delete Ring]    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           ╭─────────────────────╮                       │   │
│  │       ╭───│   ○  ○  ○  ○  ○    │───╮                   │   │
│  │       │   │  "Inner Circle"     │   │                   │   │
│  │       │   │    12 people        │   │                   │   │
│  │       ╰───│   (rotating preview)│───╯                   │   │
│  │           ╰─────────────────────╯                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Name                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Inner Circle                                        ✎   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Ring Type                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Family │ │Friends │ │  Work  │ │ Dating │ │ Custom │        │
│  │   ✓    │ │        │ │        │ │        │ │        │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                                 │
│  Ring Color                                                     │
│  ● 🟢  ○ 🔵  ○ 🟣  ○ 🟡  ○ 🔴  ○ [Custom]                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  HEALTH SCORING                                                 │
│                                                                 │
│  How often should you connect?                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Weekly  ▼                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Contact Frequency Weight                                       │
│  Less ○───────────●─────○ Very Important                        │
│                                                                 │
│  Interaction Depth Weight (video > voice > text)                │
│  Less ○─────●───────────○ Very Important                        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  MEMBERS                                              See All → │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │  👤  │ │  👤  │ │  👤  │ │  👤  │ │ +8   │                  │
│  │ Alex │ │ Sam  │ │ Mom  │ │ Dad  │ │ more │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                                 │
│                        [Save Changes]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Animation & Transition Specifications

### Solar System → Ring Focus
```
Duration: 400ms
Easing: ease-out-cubic
Camera: Dolly toward ring + slight rotation to face it
Other rings: Fade to 20% opacity over 200ms
Selected ring: Scale up 1.2x, increase glow
```

### Ring Focus → Communication View
```
Duration: 500ms  
Easing: ease-in-out-cubic
Camera: Fly INTO selected bubble
Bubble: Expand from sphere to fill screen
Background: Blur increases from 0 to 20px
3D scene: Fades to 30% opacity
```

### Communication View → Back
```
Duration: 400ms
Easing: ease-out-cubic
Content: Shrinks back into bubble position
Blur: Decreases
3D scene: Fades back in
```

### Rotation (Drag)
```
Sensitivity: 0.5° per pixel dragged
Max speed: 180°/second
Momentum: velocity * 0.95 per frame (decays over ~2 seconds)
Snap: When velocity < 5°/s, snap to nearest 15° increment
```

### Bubble Selection
```
Duration: 150ms
Transform: translateZ(+10px), scale(1.1)
Glow: Increase intensity 1.5x
Haptic: Light impact
```

---

## Performance Guidelines

### Geometry Limits
- Sphere segments: 24 (not 64) - visually smooth enough, much cheaper
- Max visible bubbles: 50 at once
- Max visible rings: 6
- Background stars: 100 particles max

### Rendering Optimizations
- Use `InstancedMesh` for identical bubble geometries
- Frustum culling (don't render off-screen objects)
- LOD: Reduce segments further when zoomed out
- Skip label rendering when bubbles < 20px on screen

### Touch Responsiveness
- 60fps minimum during gestures
- Throttle expensive updates (health recalc) to idle moments
- Debounce rapid taps (prevent double-fire)

---

## Accessibility Notes

- Minimum touch target: 44x44pt
- High contrast mode: Increase glow intensity, add outlines
- Reduce motion mode: Disable auto-rotation, use fades instead of zooms
- VoiceOver: Announce contact names and health status on focus

---

## Summary: Screen Flow

```
┌─────────────────┐
│  Solar System   │ ← Main home, all rings visible
│    Overview     │
└────────┬────────┘
         │ Tap ring
         ▼
┌─────────────────┐
│   Ring Focus    │ ← Single ring, all contacts visible
│     View        │
└────────┬────────┘
         │ Double-tap contact
         ▼
┌─────────────────┐
│  Communication  │ ← Full screen contact view
│     View        │    AI suggestions, message options
└────────┬────────┘
         │ "Set goal" or voice command
         ▼
┌─────────────────┐
│  Goal Planning  │ ← Define target, see path
│     View        │    Animated connection visualization
└─────────────────┘
```

All views share the same 3D scene - transitions are camera movements, not screen changes. This creates spatial memory and orientation.
