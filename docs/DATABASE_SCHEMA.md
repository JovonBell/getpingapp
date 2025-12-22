# Ping App - Database Schema Recommendation

## Current State Analysis
Based on your app's features, I've identified what tables you need for a fully functional Ping networking app.

## Core Features Requiring Database Tables

### 1. User Management & Profiles
- User authentication (handled by Supabase Auth)
- User profiles with business card information
- Profile pictures/avatars

### 2. Networking Features
- Contact/connection management
- Network visualization (rings/tiers)
- Contact import and selection

### 3. Communication
- Messaging between users
- Alerts and notifications
- Ping functionality

---

## Recommended Database Schema

### 1. **profiles** ✅ PRIORITY
**Purpose**: Store user profile information (digital business card)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  email TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Why needed**: Your ProfileScreen and ProfileEditScreen already reference this table

---

### 2. **connections** ✅ PRIORITY
**Purpose**: Manage relationships between users

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connected_user_id UUID REFERENCES auth.users NOT NULL,
  connection_type TEXT DEFAULT 'contact', -- 'contact', 'favorite', 'blocked'
  ring_tier INTEGER DEFAULT 3, -- 1 (inner) to 5 (outer)
  status TEXT DEFAULT 'active', -- 'pending', 'active', 'archived'
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, connected_user_id)
);

-- Indexes for performance
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX idx_connections_ring_tier ON connections(ring_tier);
```

**Why needed**:
- Your HomeScreen displays connections in ring visualization
- ContactsListScreen needs to display user's contacts
- Supports the network tier system (1-5 rings)

---

### 3. **messages** ✅ PRIORITY
**Purpose**: Store direct messages between users

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users NOT NULL,
  receiver_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read) WHERE read = FALSE;
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
```

**Why needed**: Your MessagesScreen needs to display conversations

---

### 4. **pings** 🔔 RECOMMENDED
**Purpose**: Track "ping" interactions (quick check-ins)

```sql
CREATE TABLE pings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users NOT NULL,
  receiver_id UUID REFERENCES auth.users NOT NULL,
  ping_type TEXT DEFAULT 'general', -- 'general', 'coffee', 'meeting', 'collaboration'
  message TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'acknowledged', 'ignored'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pings_receiver ON pings(receiver_id);
CREATE INDEX idx_pings_status ON pings(status);
```

**Why needed**:
- Core feature of "Ping" app
- AlertsScreen shows ping notifications
- Enables quick networking touchpoints

---

### 5. **alerts** 🔔 RECOMMENDED
**Purpose**: System notifications and activity feed

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  alert_type TEXT NOT NULL, -- 'ping', 'connection', 'message', 'system'
  title TEXT NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES auth.users,
  related_entity_type TEXT, -- 'ping', 'message', 'connection'
  related_entity_id UUID,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_unread ON alerts(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_alerts_type ON alerts(alert_type);
```

**Why needed**: AlertsScreen displays these notifications

---

### 6. **contact_imports** 📱 OPTIONAL
**Purpose**: Track imported contacts from phone/external sources

```sql
CREATE TABLE contact_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  source TEXT NOT NULL, -- 'phone', 'linkedin', 'manual'
  contact_data JSONB NOT NULL,
  matched_user_id UUID REFERENCES auth.users,
  import_status TEXT DEFAULT 'pending', -- 'pending', 'matched', 'invited', 'skipped'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Why needed**: ImportContactsScreen and SelectContactsScreen functionality

---

### 7. **interaction_history** 📊 OPTIONAL
**Purpose**: Track all interactions for analytics and smart suggestions

```sql
CREATE TABLE interaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connected_user_id UUID REFERENCES auth.users NOT NULL,
  interaction_type TEXT NOT NULL, -- 'message', 'ping', 'profile_view', 'call'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interaction_user ON interaction_history(user_id, connected_user_id);
CREATE INDEX idx_interaction_date ON interaction_history(created_at);
```

**Why needed**:
- Powers "last interaction" tracking
- Suggests who to reach out to
- Network health analytics

---

## Storage Buckets

### 1. **profile-pictures** ✅ PRIORITY
- **Type**: Public bucket
- **Purpose**: Store user avatar images
- **Max file size**: 5MB
- **Allowed formats**: jpg, png, webp

### 2. **message-attachments** 📎 OPTIONAL
- **Type**: Private bucket
- **Purpose**: Store files shared in messages
- **Max file size**: 10MB

---

## Row Level Security (RLS) Policies

All tables should have RLS enabled with these general rules:

### For `profiles`:
- ✅ Users can read any profile (for discovery)
- ✅ Users can update only their own profile
- ✅ Users can insert only their own profile

### For `connections`:
- ✅ Users can read their own connections
- ✅ Users can insert connections where they are the user_id
- ✅ Users can update their own connections
- ✅ Users can read connections where they are the connected_user_id (for mutual connections)

### For `messages`:
- ✅ Users can read messages where they are sender or receiver
- ✅ Users can insert messages where they are the sender
- ✅ Users can update messages where they are the receiver (for marking as read)

### For `pings`:
- ✅ Users can read pings where they are sender or receiver
- ✅ Users can insert pings where they are the sender
- ✅ Users can update pings where they are the receiver (for acknowledgment)

### For `alerts`:
- ✅ Users can read only their own alerts
- ✅ Users can update only their own alerts (for marking as read)
- ✅ System can insert alerts for any user

---

## Implementation Priority

### Phase 1 - MVP (Do Now) ✅
1. **profiles** - Already referenced in code
2. **connections** - Needed for contact list and network visualization
3. **messages** - Needed for messaging feature
4. **profile-pictures** bucket - Already referenced in code

### Phase 2 - Core Features 🔔
5. **pings** - Core app feature
6. **alerts** - Needed for AlertsScreen

### Phase 3 - Enhanced Features 📱
7. **contact_imports** - For onboarding flow
8. **interaction_history** - For analytics

---

## Next Steps

Would you like me to:
1. **Create all Phase 1 tables** (profiles, connections, messages) with RLS policies?
2. **Set up the storage buckets** (profile-pictures)?
3. **Generate the SQL migration file** for you to review?
4. **Create specific tables** one at a time?

Just tell me what you'd like to build first!
