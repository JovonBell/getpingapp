# Scaling Plan: 10,000 Users × 1,000 Contacts

## Overview

This plan prepares GetPing to handle 10 million contact records across 10,000 users while maintaining fast import times, responsive UI, and reasonable infrastructure costs (~$40/month).

---

## Phase 1: Database Optimizations (Week 1)

### 1.1 Add Missing Indexes

Create indexes for common query patterns that are currently missing:

```sql
-- For contact search by email/phone
CREATE INDEX idx_imported_contacts_email ON imported_contacts(email);
CREATE INDEX idx_imported_contacts_phone ON imported_contacts(phone);

-- For reverse lookups (finding who has a user as a contact)
CREATE INDEX idx_imported_contacts_matched_user ON imported_contacts(matched_user_id)
  WHERE matched_user_id IS NOT NULL;

-- For contact-centric activity queries
CREATE INDEX idx_activity_log_contact ON activity_log(related_contact_id)
  WHERE related_contact_id IS NOT NULL;

-- For reminder due date queries
CREATE INDEX idx_reminders_due ON reminders(due_date)
  WHERE is_completed = false AND is_dismissed = false;
```

### 1.2 Increase Query Chunk Sizes

Update `utils/supabaseSync.js` to use larger batches:

| Current | New | Location |
|---------|-----|----------|
| 500 | 1000 | `findUsersByHashes()` chunk size |
| 200 | 500 | `contactsImport.js` hash batch size |

### 1.3 Add Database Connection Pooling

Configure Supabase connection pooling in dashboard:
- Mode: Transaction
- Pool size: 15 connections
- Timeout: 30 seconds

---

## Phase 2: Background Job Queue (Week 2)

### 2.1 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  Import Queue   │────▶│   Supabase      │
│                 │     │  (Edge Function)│     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        └──────────────▶│  Status Polling │
                        │  or Push Notify │
                        └─────────────────┘
```

### 2.2 Create Import Queue Table

```sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_contacts INTEGER NOT NULL,
  processed_contacts INTEGER DEFAULT 0,
  matched_contacts INTEGER DEFAULT 0,
  error_message TEXT,
  contacts_data JSONB NOT NULL,  -- Temporary storage during processing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_import_jobs_user_status ON import_jobs(user_id, status);
CREATE INDEX idx_import_jobs_pending ON import_jobs(status, created_at)
  WHERE status = 'pending';

-- RLS
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own jobs" ON import_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own jobs" ON import_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2.3 Create Edge Function: `process-import-queue`

```javascript
// supabase/functions/process-import-queue/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BATCH_SIZE = 100;  // Process 100 contacts at a time
const MAX_PROCESSING_TIME = 25000;  // 25 seconds (Edge function limit is 30s)

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get next pending job
  const { data: job, error } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!job) {
    return new Response(JSON.stringify({ message: 'No pending jobs' }), { status: 200 });
  }

  // Mark as processing
  await supabase
    .from('import_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', job.id);

  const startTime = Date.now();
  const contacts = job.contacts_data;
  let processed = job.processed_contacts;
  let matched = job.matched_contacts;

  try {
    // Process in batches until time runs out
    while (processed < contacts.length && (Date.now() - startTime) < MAX_PROCESSING_TIME) {
      const batch = contacts.slice(processed, processed + BATCH_SIZE);

      // Hash and match this batch
      const { matchedCount } = await processContactBatch(supabase, job.user_id, batch);

      processed += batch.length;
      matched += matchedCount;

      // Update progress
      await supabase
        .from('import_jobs')
        .update({ processed_contacts: processed, matched_contacts: matched })
        .eq('id', job.id);
    }

    // Check if complete
    if (processed >= contacts.length) {
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          contacts_data: null  // Clear temp data
        })
        .eq('id', job.id);
    }
    // If not complete, job stays in 'processing' for next invocation

    return new Response(JSON.stringify({
      processed,
      matched,
      complete: processed >= contacts.length
    }));

  } catch (error) {
    await supabase
      .from('import_jobs')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', job.id);

    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function processContactBatch(supabase, userId, contacts) {
  // 1. Hash all emails and phones
  const emailHashes = await hashIdentifiers(contacts.flatMap(c => c.emails || []));
  const phoneHashes = await hashIdentifiers(contacts.flatMap(c => c.phones || []));

  // 2. Find matching users
  const { data: emailMatches } = await supabase
    .from('user_identities')
    .select('hash, user_id')
    .eq('type', 'email')
    .in('hash', emailHashes);

  const { data: phoneMatches } = await supabase
    .from('user_identities')
    .select('hash, user_id')
    .eq('type', 'phone')
    .in('hash', phoneHashes);

  // 3. Build match map
  const matchMap = new Map();
  [...(emailMatches || []), ...(phoneMatches || [])].forEach(m => {
    matchMap.set(m.hash, m.user_id);
  });

  // 4. Upsert contacts with matched_user_id
  const contactsToUpsert = contacts.map(contact => ({
    user_id: userId,
    contact_id: contact.id,
    name: contact.name,
    initials: contact.initials,
    email: contact.email,
    phone: contact.phone,
    matched_user_id: findMatchedUser(contact, matchMap)
  }));

  await supabase
    .from('imported_contacts')
    .upsert(contactsToUpsert, { onConflict: 'user_id,contact_id' });

  // 5. Create connections for matches
  const connections = contactsToUpsert
    .filter(c => c.matched_user_id)
    .map(c => ({
      user_id: userId,
      connected_user_id: c.matched_user_id,
      connection_type: 'contact',
      status: 'active'
    }));

  if (connections.length > 0) {
    await supabase
      .from('connections')
      .upsert(connections, { onConflict: 'user_id,connected_user_id' });
  }

  return { matchedCount: connections.length };
}
```

### 2.4 Schedule Job Processing

Use pg_cron to run every 30 seconds:

```sql
-- Enable pg_cron extension (in Supabase dashboard)
SELECT cron.schedule(
  'process-import-queue',
  '*/30 * * * * *',  -- Every 30 seconds
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-import-queue',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

---

## Phase 3: Client-Side Changes (Week 2-3)

### 3.1 Update Import Flow

**Before (blocking):**
```
User selects contacts → Hash → Match → Save → Done
         └────────────── 30+ seconds blocking ──────────────┘
```

**After (async):**
```
User selects contacts → Save locally → Create job → Done (instant)
                                            │
                              Background: Process → Notify when complete
```

### 3.2 New Import Function

```javascript
// utils/contactsImport.js - Add new async import

export async function submitContactsForImport(contacts, userId) {
  // 1. Save to local storage immediately (for offline access)
  await saveImportedContactsLocal(contacts);

  // 2. Create background job
  const { data: job, error } = await supabase
    .from('import_jobs')
    .insert({
      user_id: userId,
      total_contacts: contacts.length,
      contacts_data: contacts
    })
    .select()
    .single();

  if (error) throw error;

  return job.id;
}

export async function pollImportStatus(jobId) {
  const { data: job } = await supabase
    .from('import_jobs')
    .select('status, processed_contacts, total_contacts, matched_contacts')
    .eq('id', jobId)
    .single();

  return {
    status: job.status,
    progress: job.processed_contacts / job.total_contacts,
    matched: job.matched_contacts,
    isComplete: job.status === 'completed'
  };
}
```

### 3.3 Import Progress UI

Add a progress indicator to the home screen:

```javascript
// components/ImportProgressBanner.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { pollImportStatus } from '../utils/contactsImport';

export function ImportProgressBanner({ jobId, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [matched, setMatched] = useState(0);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const status = await pollImportStatus(jobId);
      setProgress(status.progress);
      setMatched(status.matched);

      if (status.isComplete) {
        clearInterval(interval);
        onComplete?.(status);
      }
    }, 2000);  // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobId]);

  if (!jobId) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Importing contacts... {Math.round(progress * 100)}%
      </Text>
      <Text style={styles.subtext}>
        {matched} friends found on Ping
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}
```

---

## Phase 4: Rate Limiting & Protection (Week 3)

### 4.1 Import Rate Limits

```sql
-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_import_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_jobs INTEGER;
BEGIN
  -- Max 3 imports per hour per user
  SELECT COUNT(*) INTO recent_jobs
  FROM import_jobs
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN recent_jobs < 3;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint trigger
CREATE OR REPLACE FUNCTION enforce_import_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_import_rate_limit(NEW.user_id) THEN
    RAISE EXCEPTION 'Import rate limit exceeded. Please wait before importing more contacts.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER import_rate_limit_trigger
  BEFORE INSERT ON import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_import_rate_limit();
```

### 4.2 Global Concurrency Limit

```sql
-- Limit concurrent processing jobs
CREATE OR REPLACE FUNCTION check_global_processing_limit()
RETURNS BOOLEAN AS $$
DECLARE
  processing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO processing_count
  FROM import_jobs
  WHERE status = 'processing';

  RETURN processing_count < 50;  -- Max 50 concurrent imports
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 5: Caching Layer (Week 4)

### 5.1 Add React Query for Client Caching

```javascript
// utils/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
    },
  },
});

// Cached queries for expensive operations
export const contactQueries = {
  circles: (userId) => ({
    queryKey: ['circles', userId],
    queryFn: () => fetchCirclesWithMembers(userId),
    staleTime: 10 * 60 * 1000,  // 10 minutes
  }),

  healthScores: (userId) => ({
    queryKey: ['health', userId],
    queryFn: () => fetchHealthScores(userId),
    staleTime: 60 * 60 * 1000,  // 1 hour (updated daily anyway)
  }),

  contacts: (userId) => ({
    queryKey: ['contacts', userId],
    queryFn: () => fetchImportedContacts(userId),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  }),
};
```

### 5.2 Optimistic Updates

```javascript
// When user moves contact to different circle
export async function moveContactToCircle(contactId, newCircleId) {
  // Optimistically update cache
  queryClient.setQueryData(['circles', userId], (old) => {
    // Move contact in cached data immediately
    return updateCircleMembership(old, contactId, newCircleId);
  });

  try {
    // Then sync to server
    await supabase
      .from('circle_members')
      .upsert({ circle_id: newCircleId, imported_contact_id: contactId });
  } catch (error) {
    // Rollback on error
    queryClient.invalidateQueries(['circles', userId]);
    throw error;
  }
}
```

---

## Phase 6: Monitoring & Observability (Week 4)

### 6.1 Import Analytics Table

```sql
CREATE TABLE import_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_imports INTEGER DEFAULT 0,
  total_contacts_imported INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  avg_import_time_seconds NUMERIC,
  failed_imports INTEGER DEFAULT 0,
  UNIQUE(date)
);

-- Trigger to update analytics
CREATE OR REPLACE FUNCTION update_import_analytics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO import_analytics (date, total_imports, total_contacts_imported, total_matches)
    VALUES (CURRENT_DATE, 1, NEW.total_contacts, NEW.matched_contacts)
    ON CONFLICT (date) DO UPDATE SET
      total_imports = import_analytics.total_imports + 1,
      total_contacts_imported = import_analytics.total_contacts_imported + NEW.total_contacts,
      total_matches = import_analytics.total_matches + NEW.matched_contacts;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER import_analytics_trigger
  AFTER UPDATE ON import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_analytics();
```

### 6.2 Dashboard Query

```sql
-- Daily import stats for monitoring
SELECT
  date,
  total_imports,
  total_contacts_imported,
  total_matches,
  ROUND(total_matches::numeric / NULLIF(total_contacts_imported, 0) * 100, 2) as match_rate_pct,
  avg_import_time_seconds
FROM import_analytics
ORDER BY date DESC
LIMIT 30;
```

---

## Implementation Checklist

### Week 1: Database
- [ ] Add missing indexes (4 indexes)
- [ ] Update chunk sizes in `supabaseSync.js`
- [ ] Configure connection pooling in Supabase dashboard
- [ ] Test query performance with sample 10K contacts

### Week 2: Background Jobs
- [ ] Create `import_jobs` table with RLS
- [ ] Create Edge Function `process-import-queue`
- [ ] Set up pg_cron scheduler
- [ ] Test job processing with 1K contacts

### Week 3: Client Updates
- [ ] Refactor `SelectContactsScreen.js` for async import
- [ ] Create `ImportProgressBanner` component
- [ ] Add import status polling
- [ ] Update onboarding flow for new import UX
- [ ] Add rate limit error handling

### Week 4: Polish
- [ ] Add React Query caching
- [ ] Implement optimistic updates
- [ ] Create analytics table and triggers
- [ ] Build monitoring dashboard
- [ ] Load test with simulated 10K users

---

## Cost Projection

| Phase | Users | Monthly Cost |
|-------|-------|--------------|
| Launch | 0-1,000 | $25 (Pro base) |
| Growth | 1,000-5,000 | $30-35 |
| Scale | 5,000-10,000 | $35-45 |
| Beyond | 10,000+ | $50+ (consider dedicated) |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Edge function timeout | Process in chunks, resume on next invocation |
| Database overload | Rate limiting + connection pooling |
| Data loss during import | Local storage first, then sync |
| User confusion | Progress UI with clear status |
| Cost overrun | Analytics monitoring + alerts |

---

## Success Metrics

- Import completion rate: >99%
- Average import time (1K contacts): <60 seconds
- Match rate visibility: Real-time progress
- System uptime during bulk imports: 99.9%
- User satisfaction: No blocking UI during import
