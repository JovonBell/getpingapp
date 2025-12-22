# Ping! Product Vision

> "The connection god app. Snapchat meets LinkedIn meets Apple (hardware)."

## The Core Problem

**85% of connections never follow up or maintain the connection.**

LinkedIn doesn't solve this. The root cause: limited time to convey/collect enough information to make a *real* connection. Surface-level commonalities ("we're both in tech and like basketball") aren't deep enough to create lasting bonds.

## The Ping! Solution

### Philosophy
- Not about maintaining ALL connections - some naturally fade for good reason
- Focus on strengthening the bonds you *actually* care about
- High-quality, intentional connections over LinkedIn noise
- Help users ask better questions that create memorable moments
- Enable the "Rule of 6 Connections" - reach anyone through strategic networking

### The Founder's Superpower (Reece)
Reece asks surprising, out-of-the-box questions that put people on their back foot. Questions that make people think "who IS this guy?" while he sits there smiling. These create emotional, thoughtful interactions that forge stronger bonds.

**Ping AI should help everyone develop this superpower.**

---

## Product Components

### 1. Hardware: The Ping Ring
- Physical ring with NFC chip
- Encodes user's ping profile
- Tap to iPhone to share contact
- **Patent submitted:** Ring-to-ring handshake auto-connects with "ping!" sound effect

### 2. Software: The Ping App
- Visual network representation (concentric rings/spheres)
- AI companion for relationship intelligence
- Multi-modal communication (video, voice, not just text)
- Goal-oriented connection management

---

## Ring/Circle System

### Terminology
- Referred to as "rings" within ping (not circles)
- Closest rings = closest people (user-defined meaning)
- Could be family, S.O., best friends - user chooses

### Behavior
- People CAN exist in multiple rings
- Movement between rings is rare but possible
- Vision: Spherical rotation (rotate on multiple axes, not just one)
- More three.js interaction for real representation

### Health Scoring
- Should be a **compound score**
- Different algorithms/weights for different relationship types
- Investment banking connection ≠ romantic interest ≠ family
- Some variables activate/deactivate based on tags/relationship type

---

## Growth Mechanics

### How You Add Contacts
1. Phone import (current)
2. Meet people IRL: events, networking, startups, art events, subway, museums
3. Ring NFC tap (hardware)
4. Ring-to-ring handshake (future)

### The Value Progression
1. **Start:** Visualize your network (hooks users)
2. **Retain:** Take action through the app
3. **Empower:** Grow network toward specific goals

### Goal-Oriented Networking
User goals can include:
- Job hunting
- Finding a cofounder
- Meeting artists
- Hiring
- Making friends
- Dating ("hoes circle")
- Life partner
- Investment connections

**Phase of life determines focus.** Can be more contacts, deeper relationships, or both.

---

## The Ping AI Agent

### Inspiration: Poke by Interaction
- Great at creating "human understanding"
- Biggest innovation: **memory handling**
- Users connect data sources via MCP
- Currently "continuously snarky" - we can do better

Research needed:
- poke.com/mcp documentation
- Reddit discussions
- How they handle memory
- User interaction patterns

### Ping AI Differentiators
- Help users ask better questions
- Suggest the right (maybe controversial/risky) comments
- Evoke emotional, thoughtful interactions
- Not boilerplate, not just texts
- Create that "who is this guy?" moment

### Data Sources (MCP Integration)
- LinkedIn data
- Apple contacts/personal data
- Deep web people search
- "MCP for every type of data/interaction" - founder has access

---

## Communication Philosophy

### Why Text Falls Short
Text loses:
- Body language
- Implicit meaning
- Real interaction
- Emotional nuance

### The Ping Medium
- Short, meaningful video messages
- Voice messages
- Real interaction with body language
- "Snapchat for business people of Gen Z"

### Connection Quality Control
- Must have stated intention
- Message required with "goal" tag
- Each connection is high-quality
- Intentions are clearer
- Time is valued

---

## The Rule of 6 Connections

### Theory
You can reach anyone on earth through ~6 connections. High-agency people leverage this.

### Ping Enables This
With the right data + UX, help users:
1. Identify peripheral/collateral connections
2. Use them as connection points toward future goals
3. Map paths to target connections

### Real Example: Runway CEO Path

**Context:** Reece and founder both in AI since undergrad, both used Runway since 2022.

**Connection 1:** Professor (close mentor) interviewing Runway CEO
**Connection 2:** Random guy at Brazilian steakhouse (Hassan) - engineer at Runway, works on world models, knows Chris (CEO)

**Result:** 2 steps toward CEO. Third connection easily findable.

**Different goals, same connection:**
- Reece: Educational partnerships for undergrad AI lab
- Founder: Future of world modeling research

**This is what Ping enables.**

---

## Technical Needs

### Data Integration
- LinkedIn API/scraping
- Apple Contacts
- Deep web people search
- MCP server endpoints for custom agents
- Memory system (inspired by Poke)

### 3D Visualization (Three.js)

**Core Metaphor: Solar System**
- Network = solar system you navigate in 3D
- Rings = orbits (user-defined: family, friends, professional)
- Connections = semi-transparent spheres/bubbles on each ring
- Data = dots/mini-bubbles ON each person's sphere

**Person Bubble Contains:**
- MCP data points (LinkedIn, calendar, email) as dots
- Shared interactions as mini-bubbles
- Memories/notes
- Health indicator (glow intensity)
- Connection strength (opacity)

**Navigation:**
- Multi-axis rotation (spherical, not just one axis)
- Zoom out: see all rings
- Zoom in: focus on single ring
- Tap bubble: smooth 3D zoom → communication view

**Goal Visualization:**
- Tentative connections = ghosted/dotted bubbles
- Connection paths = lit-up lines through rings
- Agent suggestions = bubble glow/pulse

### AI Agent (Not a Separate Screen)

Agent is built into main interaction:
- Always-on voice/text input
- Triggers agentic work in background (Poke-style)
- Results visualized in 3D:
  - Target person appears as ghosted bubble
  - Path lights up through existing connections
  - Bubbles pulse when agent has insights

**Goal Flow:**
1. Tell agent goal → "I want to reach Runway CEO"
2. Agent places target on system (tentative bubble)
3. Voice/type intentions
4. Agent decides: direct or need intermediary connections?
5. Path visualized in 3D
6. At each step, agent crafts outreach

### Backend
- Compound health scoring algorithms
- Tag/relationship type system
- Goal tracking per connection
- Path finding (Rule of 6)

---

## Open Questions

1. How to prevent LinkedIn-style noise while enabling discovery?
2. Exact compound scoring algorithm variables per relationship type?
3. How does ring-to-ring auto-connect work technically?
4. What makes a "goal tag" system actually useful vs. friction?
5. How to balance AI suggestions (helpful vs. intrusive)?

---

## Next Steps

1. Map all screens (zoom out, understand full vision)
2. Research Poke's memory system
3. Define relationship type taxonomy
4. Design compound scoring algorithm
5. Possibly redesign screens with design thinking approach
