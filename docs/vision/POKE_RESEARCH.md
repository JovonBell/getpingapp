# Poke Research - Memory System & Architecture

## Overview

Poke by Interaction Company of California is an AI assistant that lives inside iMessage. Key innovations:
- Multi-agent orchestration (not single-thread tool calls)
- Memory handling that creates "human understanding"
- Proactive behavior without prompts
- Personality that feels human (sassy, witty, direct)

## Architecture: Orchestrated Multi-Agent System

Unlike typical AI (iterative tool calls in single thread), Poke uses:

### 1. Interaction Agent
The conductor that:
- Manages conversation with user
- Maintains context
- Spawns Execution Agents on-demand
- Synthesizes outputs into coherent replies
- Handles personality/UX layer
- Filters noise (discards irrelevant info)

### 2. Execution Agents  
Specialized workers spawned for specific tasks:
- Each has own persistent memory
- Operates independently in parallel
- Can be reused for follow-up queries
- Pure task machines (no personality instructions)

### Example Flow
1. User: "Ask Alice and Bob if they're free for lunch"
2. Interaction Agent checks roster - no existing agents
3. Spawns two agents: "Email to Alice" + "Email to Bob"
4. Both work in parallel, drafting emails
5. Interaction Agent synthesizes: "I've drafted invitations. Send both?"
6. Same agents handle the sending

### Agent Persistence
- "Email to Alice" agent from a month ago still holds full context
- Can answer follow-up questions about that thread
- Preserves complete operational histories

## Memory System (3 Layers)

### Layer 1: Conversation Memory (Interaction Agent)
- Continuous compression at cascading layers
- Recent interactions at full fidelity
- Older summaries undergo progressive compression
- Natural decay curve

### Layer 2: Agent Memory (Execution Agents)
- Each agent maintains complete log of:
  - Every action taken
  - Every tool called
  - Every result received
- No compression - full operational histories
- Enables context for follow-ups

### Layer 3: Email as External Memory
- Treats email access as memory infrastructure
- Your inbox = living archive of your life
- Temporal knowledge (patterns over years)
- Passive context accumulation
- No manual briefings needed

## Key Design Decisions

### Personality Separation
- Interaction Agent: entire personality layer
- Execution Agents: pure task machines, zero personality
- Can iterate UX without touching functionality
- Can optimize execution without breaking voice

### Asynchronous Design
- Give 5 tasks, continue chatting while they execute
- Parallel execution vs sequential request-response
- More natural, more powerful

### Proactive Behavior
- Monitors running in background
- Surfaces important info without prompts
- Anticipates user needs
- Daily summaries, important email alerts

## Technical Details

### Cost Optimization
- ~$50/user/month in actual costs
- Uses smaller models for simple tasks (trigger creation)
- Careful model selection per task type

### Platform Choice
- Lives in iMessage (not separate app)
- Every phone already has it
- Continuous conversation flow
- Meets users where they are

### Deliberate Constraints
- Doesn't try to code or generate images
- Excels at specific things vs. doing everything
- Constraints enabled perfection

## Implications for Ping AI

### What to Adopt

1. **Multi-Agent Architecture**
   - Interaction Agent for personality + coordination
   - Execution Agents for specific tasks (email, research, outreach)
   - Agent persistence for follow-ups

2. **Layered Memory**
   - Conversation summaries with compression
   - Agent-specific operational memory
   - External data as memory (contacts, interactions, LinkedIn)

3. **Proactive Intelligence**
   - Background monitors for relationship health
   - Surface insights without prompts
   - "Your connection with X is fading" alerts

4. **Personality Layer**
   - Not sycophantic like ChatGPT
   - Sharp, witty, direct
   - Helps users develop "the Reece superpower"

### What to Differentiate

1. **Focus Area**
   - Poke: email/calendar/task management
   - Ping: relationship intelligence + networking strategy

2. **Core Value**
   - Poke: reduce friction in daily tasks
   - Ping: forge stronger connections, reach anyone through Rule of 6

3. **Personality**
   - Poke: continuously snarky
   - Ping: helps you be more interesting (question generation)

4. **Data Sources**
   - Poke: email, calendar, Notion, Linear
   - Ping: contacts, LinkedIn, events, NFC ring, video/voice messages

### Implementation Priority

1. **Phase 1: Memory Foundation**
   - `agent_memories` table with embeddings
   - Memory formation/retrieval system
   - Contact-specific memory (facts, preferences)

2. **Phase 2: Agent Architecture**
   - Interaction Agent (conversation handler)
   - Specialized Execution Agents:
     - "Outreach to X" agent
     - "Research person Y" agent
     - "Plan path to Z" agent

3. **Phase 3: Proactive Intelligence**
   - Health score monitors
   - Important moment alerts
   - Question suggestions

4. **Phase 4: Data Integration**
   - MCP endpoints for external data
   - LinkedIn enrichment
   - Calendar analysis for meeting patterns

## OpenPoke Implementation

GitHub: https://github.com/ComposioHQ/open-poke

Key components to study:
- Agent spawning/orchestration logic
- Memory compression algorithms
- Tool call handling across agents
- Roster management (which agents exist)

### Challenges Identified
1. **Execution Agent Overload** - Hundreds of agents competing for attention
2. **Personality Gap** - Hard to match without fine-tuning
3. **Economics** - 10-15 LLM calls per user message
4. **Response Latency** - Needs optimization for snappy feel

## Proactive Intelligence Examples (Screenshots)

From real Poke usage:

### Hydration Reminder
- "It's hydration time! Remember to drink some water"
- Unprompted, context-aware health nudges

### Proactive Book Recommendation
- "Also, came across this book that seemed perfect for you:"
- Shape Up: Stop Running in Circles and Ship Work that Matters by Ryan Singer
- "This might be exactly what you need for completing projects rather than leaving them unfinished. It explains how Basecamp uses 6-week cycles with strict scope control to actually finish work."
- "The methodology could really help with turning your design ideas into shipped products rather than endless iterations."
- "Free to read online:" + link preview to basecamp.com

### Key Observations
1. **Proactive surfacing** - Poke found and recommended content without being asked
2. **Deep personalization** - Knew user struggles with finishing projects, endless iterations
3. **Contextual relevance** - Book about shipping work, directly relevant to user's pain points
4. **Natural delivery** - Conversational, not robotic or formal
5. **Rich formatting** - Link previews, structured summaries
6. **Multi-message format** - Breaks content into digestible chunks (mimics human texting)

### User Response: "BRO WHAT"
- Genuine surprise at the relevance/quality
- This is the reaction Ping should aim for
- The "who is this guy?" moment Reece creates IRL

---

## Sources

- OpenPoke blog: https://shloked.com/writing/openpoke
- Composio implementation: https://composio.dev/blog/open-poke
- ComposioHQ/open-poke GitHub repository
- Product Hunt reviews
- Leaked system prompts (exfiltrated via email)
- Founder screenshots (December 2024)
