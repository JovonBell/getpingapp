# Ping! Backend Requirements

## Current Architecture

### Database: Supabase (PostgreSQL)
- `profiles` - User profiles
- `circles` - Ring definitions (name, tier, user_id)
- `circle_members` - Contact-to-ring mapping
- `imported_contacts` - Phone contacts
- `relationship_health` - Health scores
- `alerts` - Health alerts
- `reminders` - Follow-up reminders
- `messages` - In-app messaging
- `user_streaks` - Gamification streaks
- `user_achievements` - Achievement tracking
- `activity_log` - User activity
- `health_snapshots` - Historical health data
- `notification_preferences` - Push settings
- `user_identities` - For contact matching (hashed)
- `connections` - User-to-user connections

### Authentication
- Google OAuth (Supabase Auth)
- Apple Sign In (configured)

### Edge Functions
- `delete-account` - Account deletion

---

## Required New Tables

### Goal/Intention System
```sql
-- Connection goals
CREATE TABLE connection_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  contact_id UUID REFERENCES imported_contacts,
  goal_type TEXT NOT NULL, -- 'job', 'cofounder', 'friend', 'romantic', 'strategic', 'hiring', 'mentor'
  intention TEXT, -- Why they want to connect
  timeline TEXT, -- 'urgent', 'near_term', 'long_term', 'evergreen'
  success_criteria TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'achieved', 'abandoned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achieved_at TIMESTAMP WITH TIME ZONE
);

-- Goal tags for categorization
CREATE TABLE goal_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  icon TEXT
);
```

### Relationship Type System
```sql
-- Relationship types with scoring weights
CREATE TABLE relationship_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'professional', 'personal', 'romantic', 'family', 'strategic'
  display_name TEXT NOT NULL,
  scoring_weights JSONB NOT NULL, -- {"days_since": 0.3, "frequency": 0.2, ...}
  decay_rate FLOAT DEFAULT 1.0, -- Multiplier for health decay
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact relationship type assignment
CREATE TABLE contact_relationship_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  contact_id UUID REFERENCES imported_contacts NOT NULL,
  relationship_type_id UUID REFERENCES relationship_types NOT NULL,
  UNIQUE(user_id, contact_id, relationship_type_id)
);
```

### Multi-Ring Support
```sql
-- Allow contacts in multiple rings
ALTER TABLE circle_members 
  DROP CONSTRAINT IF EXISTS circle_members_unique;

-- Track primary ring for a contact
ALTER TABLE circle_members 
  ADD COLUMN is_primary BOOLEAN DEFAULT false;
```

### Video/Voice Messaging
```sql
-- Rich media messages
CREATE TABLE media_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users NOT NULL,
  receiver_id UUID REFERENCES auth.users,
  receiver_contact_id UUID REFERENCES imported_contacts, -- For non-users
  media_type TEXT NOT NULL, -- 'video', 'voice'
  media_url TEXT NOT NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  transcript TEXT, -- AI transcription
  viewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### AI Agent Memory
```sql
-- Agent memory (Poke-inspired)
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  memory_type TEXT NOT NULL, -- 'fact', 'preference', 'goal', 'interaction', 'insight'
  subject_contact_id UUID REFERENCES imported_contacts, -- About which contact
  content TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  source TEXT, -- Where this info came from
  embedding VECTOR(1536), -- For semantic search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Some memories fade
);

-- Agent conversation history
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  messages JSONB NOT NULL, -- [{role, content, timestamp}]
  context JSONB, -- Active contact, goal, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated insights
CREATE TABLE agent_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  insight_type TEXT NOT NULL, -- 'connection_path', 'common_interest', 'opportunity', 'suggestion'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_contacts UUID[], -- Array of contact IDs
  actionable BOOLEAN DEFAULT true,
  dismissed BOOLEAN DEFAULT false,
  acted_on BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Connection Path Tracking (Rule of 6)
```sql
-- Known connection paths
CREATE TABLE connection_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  target_contact_id UUID REFERENCES imported_contacts, -- Who they want to reach
  target_name TEXT, -- If not in contacts yet
  target_company TEXT,
  target_role TEXT,
  path_contacts UUID[], -- Ordered array of contact IDs in the path
  path_length INTEGER,
  confidence FLOAT, -- How confident are we in this path
  status TEXT DEFAULT 'identified', -- 'identified', 'in_progress', 'completed', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### People Enrichment Cache
```sql
-- Enriched contact data from external sources
CREATE TABLE contact_enrichment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES imported_contacts NOT NULL UNIQUE,
  linkedin_url TEXT,
  linkedin_data JSONB, -- Cached LinkedIn profile
  twitter_handle TEXT,
  twitter_data JSONB,
  company TEXT,
  role TEXT,
  location TEXT,
  mutual_connections UUID[], -- Other contacts who know them
  interests TEXT[],
  enrichment_source TEXT,
  enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Re-enrich after this
);
```

### NFC Ring Events
```sql
-- Ring tap events
CREATE TABLE ring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL, -- 'tap_to_phone', 'ring_to_ring'
  partner_user_id UUID REFERENCES auth.users, -- If ring-to-ring
  partner_contact_data JSONB, -- If tap to non-user phone
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Required Edge Functions

### AI Agent Endpoints
```
POST /functions/v1/agent/chat
  - Main agent conversation endpoint
  - Handles memory retrieval/storage
  - Generates responses with context

POST /functions/v1/agent/generate-questions
  - Generate conversation starters
  - Input: contact context, goal
  - Output: 3-5 tailored questions

POST /functions/v1/agent/find-path
  - Find connection path to target
  - Input: target person details
  - Output: suggested path through contacts

POST /functions/v1/agent/craft-outreach
  - Generate personalized outreach message
  - Input: contact, goal, medium (text/video script)
  - Output: draft message
```

### Data Enrichment
```
POST /functions/v1/enrich/contact
  - Enrich contact with external data
  - Input: contact_id, sources to check
  - Output: enrichment data

POST /functions/v1/enrich/batch
  - Batch enrichment for multiple contacts
  
GET /functions/v1/enrich/search
  - Search for a person across sources
  - Input: name, company, other identifiers
  - Output: potential matches
```

### Media Processing
```
POST /functions/v1/media/upload
  - Upload video/voice message
  - Returns signed URL for storage

POST /functions/v1/media/transcribe
  - Transcribe audio/video
  - Store transcript for AI context

POST /functions/v1/media/thumbnail
  - Generate video thumbnail
```

---

## MCP Integration Architecture

### Server Requirements
- MCP server endpoint for Poke-style integration
- Endpoints for each data source:
  - `/mcp/linkedin` - LinkedIn data
  - `/mcp/contacts` - Apple contacts
  - `/mcp/calendar` - Calendar events
  - `/mcp/email` - Email patterns
  - `/mcp/location` - Location data

### Authentication
- OAuth flows for each external service
- Token storage and refresh
- User consent management

---

## Storage Buckets (Supabase)

### Current
- `profile-pictures` - Avatar images

### Needed
- `video-messages` - Video message files
- `voice-messages` - Voice message files
- `thumbnails` - Video thumbnails
- `media-exports` - Saved to camera roll copies

---

## Real-time Subscriptions

### Current
- None implemented

### Needed
- Message notifications
- Ring event notifications (tap detected)
- AI insight notifications
- Health score changes
- Achievement unlocks

---

## External API Integrations

| Service | Purpose | Auth Type |
|---------|---------|-----------|
| OpenAI | AI agent, embeddings | API Key |
| LinkedIn | Profile enrichment | OAuth |
| Clearbit/Apollo | People search | API Key |
| Twilio | SMS fallback | API Key |
| SendGrid | Email notifications | API Key |
| Apple Push | Push notifications | Certificates |

---

## Performance Considerations

### Caching
- Cache enrichment data (expires after X days)
- Cache connection paths
- Cache AI embeddings

### Background Jobs
- Daily health score recalculation
- Weekly insight generation
- Enrichment refresh for stale data
- Memory consolidation for AI

### Rate Limiting
- AI endpoints: 100 req/min per user
- Enrichment: 50 req/day per user
- Media upload: 10/hour per user
