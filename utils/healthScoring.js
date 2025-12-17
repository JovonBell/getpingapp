import { supabase } from '../lib/supabase';

// Tier target days - how often you expect to contact people in each tier
const TIER_TARGET_DAYS = {
  1: 7,   // Inner circle - weekly
  2: 14,  // Close friends - bi-weekly
  3: 21,  // Regular contacts - 3 weeks
  4: 30,  // Acquaintances - monthly
  5: 45,  // Outer circle - 6 weeks
};

// Default for contacts without a tier
const DEFAULT_TARGET_DAYS = 30;

/**
 * Calculate health score based on days since contact and tier
 * @param {number} daysSinceContact - Days since last interaction
 * @param {number} tierTargetDays - Target days for this tier
 * @returns {number} Health score 0-100
 */
export function calculateHealthScore(daysSinceContact, tierTargetDays = DEFAULT_TARGET_DAYS) {
  if (daysSinceContact <= 0) return 100;

  // Linear decay: score reaches 0 at 2x the target days
  const decayRate = 100 / (tierTargetDays * 2);
  const score = Math.max(0, Math.round(100 - (daysSinceContact * decayRate)));

  return score;
}

/**
 * Get status label from health score
 * @param {number} score - Health score 0-100
 * @returns {'healthy' | 'cooling' | 'at_risk' | 'cold'}
 */
export function getStatusFromScore(score) {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'cooling';
  if (score >= 40) return 'at_risk';
  return 'cold';
}

/**
 * Get color for health status
 * @param {string} status - Health status
 * @returns {string} Hex color code
 */
export function getHealthColor(status) {
  switch (status) {
    case 'healthy': return '#4FFFB0'; // Green
    case 'cooling': return '#FFD93D'; // Yellow
    case 'at_risk': return '#FF8C42'; // Orange
    case 'cold': return '#FF6B6B'; // Red
    default: return '#999999'; // Gray
  }
}

/**
 * Get target days for a tier
 * @param {number} tier - Circle tier (1-5)
 * @returns {number} Target days between contacts
 */
export function getTierTargetDays(tier) {
  return TIER_TARGET_DAYS[tier] || DEFAULT_TARGET_DAYS;
}

/**
 * Calculate days since a date
 * @param {Date|string} date - The date to calculate from
 * @returns {number} Days since the date
 */
function daysSince(date) {
  if (!date) return 999; // If no date, treat as very old
  const then = new Date(date);
  const now = new Date();
  const diffMs = now - then;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Refresh health scores for all contacts in circles for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, updated: number, error?: string}>}
 */
export async function refreshHealthScores(userId) {
  try {
    console.log('[HEALTH] Refreshing health scores for user:', userId);

    if (!userId) {
      return { success: false, updated: 0, error: 'Missing userId' };
    }

    // Get all circles for this user with their tiers
    const { data: circles, error: circlesErr } = await supabase
      .from('circles')
      .select('id, tier')
      .eq('user_id', userId);

    if (circlesErr) {
      // Check if table doesn't exist (migration not run)
      const errMsg = circlesErr.message?.toLowerCase() || '';
      const isMissingTable = circlesErr.code === '42P01' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('relation') ||
        errMsg.includes('schema cache');
      if (isMissingTable) {
        console.warn('[HEALTH] Circles table not found - migration may not be run');
        return { success: true, updated: 0 };
      }
      throw circlesErr;
    }

    const circleIds = circles.map(c => c.id);
    const circleIdToTier = circles.reduce((acc, c) => {
      acc[c.id] = c.tier;
      return acc;
    }, {});

    // Get circle members for these circles
    const { data: members, error: memErr } = await supabase
      .from('circle_members')
      .select('circle_id, imported_contact_id')
      .in('circle_id', circleIds);

    if (memErr) throw memErr;

    if (!members || members.length === 0) {
      console.log('[HEALTH] No contacts in circles to score');
      return { success: true, updated: 0 };
    }

    // Get existing health records (deduplicate in case contact is in multiple circles)
    const contactIds = [...new Set(members.map(m => m.imported_contact_id))];
    const { data: existingHealth, error: healthErr } = await supabase
      .from('relationship_health')
      .select('*')
      .eq('user_id', userId)
      .in('imported_contact_id', contactIds);

    if (healthErr) throw healthErr;

    const existingByContactId = (existingHealth || []).reduce((acc, h) => {
      acc[h.imported_contact_id] = h;
      return acc;
    }, {});

    // Build contact to tier mapping (use lowest tier if in multiple circles)
    const contactToTier = {};
    for (const m of members) {
      const tier = circleIdToTier[m.circle_id] || 5;
      if (!contactToTier[m.imported_contact_id] || tier < contactToTier[m.imported_contact_id]) {
        contactToTier[m.imported_contact_id] = tier;
      }
    }

    // Calculate new scores
    const now = new Date();
    const upserts = [];

    for (const contactId of contactIds) {
      const existing = existingByContactId[contactId];
      const tier = contactToTier[contactId] || 5;
      const targetDays = getTierTargetDays(tier);

      // Use existing last_contact_at or created_at as baseline
      const lastContactAt = existing?.last_contact_at || now.toISOString();
      const days = daysSince(lastContactAt);
      const score = calculateHealthScore(days, targetDays);
      const status = getStatusFromScore(score);

      upserts.push({
        user_id: userId,
        imported_contact_id: contactId,
        health_score: score,
        status: status,
        days_since_contact: days,
        last_contact_at: lastContactAt,
        last_calculated_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    }

    // Batch upsert
    if (upserts.length > 0) {
      const { error: upsertErr } = await supabase
        .from('relationship_health')
        .upsert(upserts, { onConflict: 'user_id,imported_contact_id' });

      if (upsertErr) {
        // Check if table/schema doesn't exist (migration not run)
        const errMsg = upsertErr.message?.toLowerCase() || '';
        const isMissingSchema = upsertErr.code === '42P01' ||
          upsertErr.code === 'PGRST200' ||
          upsertErr.code === 'PGRST204' ||
          upsertErr.code === '21000' ||
          errMsg.includes('does not exist') ||
          errMsg.includes('relation') ||
          errMsg.includes('schema cache') ||
          errMsg.includes('duplicate') ||
          errMsg.includes('conflict');
        if (isMissingSchema) {
          console.warn('[HEALTH] relationship_health table/schema not ready - run Phase 3 migration');
          return { success: true, updated: 0 };
        }
        console.warn('[HEALTH] Error upserting health scores:', upsertErr);
        throw upsertErr;
      }
    }

    console.log('[HEALTH] ✅ Updated', upserts.length, 'health scores');
    return { success: true, updated: upserts.length };
  } catch (error) {
    // Check if it's a missing table/schema error (migration not run) - return gracefully
    const errMsg = error?.message?.toLowerCase() || '';
    const isMissingSchema = error?.code === '42P01' ||
      error?.code === 'PGRST200' ||
      error?.code === 'PGRST204' ||
      error?.code === '21000' ||
      errMsg.includes('does not exist') ||
      errMsg.includes('relation') ||
      errMsg.includes('schema cache') ||
      errMsg.includes('duplicate') ||
      errMsg.includes('conflict');
    if (isMissingSchema) {
      console.warn('[HEALTH] Tables/schema not ready - run Phase 3 migration');
      return { success: true, updated: 0 };
    }
    console.warn('[HEALTH] Failed to refresh health scores:', error?.message || error);
    return { success: false, updated: 0, error: error?.message || String(error) };
  }
}

/**
 * Manually update health score for a contact
 * @param {string} userId - User ID
 * @param {string} contactId - Imported contact ID
 * @param {number} newScore - New health score (0-100)
 * @returns {Promise<{success: boolean, health: object|null, error?: string}>}
 */
export async function updateHealthScore(userId, contactId, newScore) {
  try {
    console.log('[HEALTH] Manually updating health score:', { contactId, newScore });

    if (!userId || !contactId) {
      return { success: false, health: null, error: 'Missing userId or contactId' };
    }

    // Clamp score to 0-100
    const score = Math.max(0, Math.min(100, Math.round(newScore)));
    const status = getStatusFromScore(score);
    const now = new Date().toISOString();

    // Calculate approximate days since contact based on score
    // If score is 100, days = 0; if score is 0, days = target * 2 (using default 30 days)
    const daysSinceContact = score === 100 ? 0 : Math.round((100 - score) / (100 / 60));

    // Upsert the health record
    const { data, error } = await supabase
      .from('relationship_health')
      .upsert({
        user_id: userId,
        imported_contact_id: contactId,
        health_score: score,
        status: status,
        days_since_contact: daysSinceContact,
        last_calculated_at: now,
        updated_at: now,
        // Keep last_contact_at as-is or set to now if score is 100
        ...(score === 100 ? { last_contact_at: now } : {}),
      }, { onConflict: 'user_id,imported_contact_id' })
      .select()
      .single();

    if (error) {
      // Check if table doesn't exist (migration not run)
      const errMsg = error.message?.toLowerCase() || '';
      const isMissingTable = error.code === '42P01' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('relation') ||
        errMsg.includes('schema cache');
      if (isMissingTable) {
        console.warn('[HEALTH] relationship_health table not found - run Phase 3 migration');
        return { success: true, health: null };
      }
      throw error;
    }

    // If score dropped, clear alert history so alerts can fire again
    if (score < 80) {
      // Don't clear - keep history so we don't spam alerts
    } else {
      // Score is healthy (80+), clear alert history for this contact
      try {
        await supabase
          .from('alert_history')
          .delete()
          .eq('user_id', userId)
          .eq('imported_contact_id', contactId);
      } catch {
        // Non-critical - ignore errors
      }
    }

    console.log('[HEALTH] ✅ Health score manually updated to:', score, status);
    return { success: true, health: data };
  } catch (error) {
    console.error('[HEALTH] ❌ Failed to update health score:', error?.message || error);
    return { success: false, health: null, error: error?.message || String(error) };
  }
}

/**
 * Log an interaction with a contact (resets their health score to 100)
 * @param {string} userId - User ID
 * @param {string} contactId - Imported contact ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logInteraction(userId, contactId) {
  try {
    console.log('[HEALTH] Logging interaction for contact:', contactId);

    if (!userId || !contactId) {
      return { success: false, error: 'Missing userId or contactId' };
    }

    const now = new Date().toISOString();

    // Upsert health record with score 100
    const { error: healthErr } = await supabase
      .from('relationship_health')
      .upsert({
        user_id: userId,
        imported_contact_id: contactId,
        health_score: 100,
        status: 'healthy',
        days_since_contact: 0,
        last_contact_at: now,
        last_calculated_at: now,
        updated_at: now,
      }, { onConflict: 'user_id,imported_contact_id' });

    if (healthErr) throw healthErr;

    // Clear alert history for this contact (so alerts can fire again if they go cold)
    const { error: historyErr } = await supabase
      .from('alert_history')
      .delete()
      .eq('user_id', userId)
      .eq('imported_contact_id', contactId);

    if (historyErr) {
      console.warn('[HEALTH] Failed to clear alert history:', historyErr);
      // Don't throw - this is non-critical
    }

    console.log('[HEALTH] ✅ Interaction logged, health reset to 100');
    return { success: true };
  } catch (error) {
    console.error('[HEALTH] ❌ Failed to log interaction:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Get health scores for all contacts in circles
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, healthScores: Array, error?: string}>}
 */
export async function getHealthScores(userId) {
  try {
    if (!userId) {
      return { success: false, healthScores: [], error: 'Missing userId' };
    }

    const { data, error } = await supabase
      .from('relationship_health')
      .select('*')
      .eq('user_id', userId)
      .order('health_score', { ascending: true });

    if (error) {
      // Check if table/schema doesn't exist (migration not run)
      const errMsg = error.message?.toLowerCase() || '';
      const isMissingSchema = error.code === '42P01' ||
        error.code === 'PGRST200' ||
        error.code === 'PGRST204' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('relation') ||
        errMsg.includes('schema cache');
      if (isMissingSchema) {
        console.warn('[HEALTH] relationship_health table/schema not ready');
        return { success: true, healthScores: [] };
      }
      throw error;
    }

    console.log('[HEALTH] Fetched', data?.length || 0, 'health scores');
    return { success: true, healthScores: data || [] };
  } catch (error) {
    // Check if it's a missing table/schema error (migration not run) - return gracefully
    const errMsg = error?.message?.toLowerCase() || '';
    const isMissingSchema = error?.code === '42P01' ||
      error?.code === 'PGRST200' ||
      error?.code === 'PGRST204' ||
      errMsg.includes('does not exist') ||
      errMsg.includes('relation') ||
      errMsg.includes('schema cache');
    if (isMissingSchema) {
      console.warn('[HEALTH] Tables/schema not ready');
      return { success: true, healthScores: [] };
    }
    console.warn('[HEALTH] Failed to get health scores:', error?.message || error);
    return { success: false, healthScores: [], error: error?.message || String(error) };
  }
}

/**
 * Get health score for a specific contact
 * @param {string} userId - User ID
 * @param {string} contactId - Imported contact ID
 * @returns {Promise<{success: boolean, health: object|null, error?: string}>}
 */
export async function getContactHealth(userId, contactId) {
  try {
    if (!userId || !contactId) {
      return { success: false, health: null, error: 'Missing userId or contactId' };
    }

    const { data, error } = await supabase
      .from('relationship_health')
      .select('*')
      .eq('user_id', userId)
      .eq('imported_contact_id', contactId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return { success: true, health: data || null };
  } catch (error) {
    console.error('[HEALTH] ❌ Failed to get contact health:', error?.message || error);
    return { success: false, health: null, error: error?.message || String(error) };
  }
}

/**
 * Get summary stats for user's relationship health
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, stats: object, error?: string}>}
 */
export async function getHealthStats(userId) {
  try {
    if (!userId) {
      return { success: false, stats: {}, error: 'Missing userId' };
    }

    const { data, error } = await supabase
      .from('relationship_health')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      healthy: 0,
      cooling: 0,
      at_risk: 0,
      cold: 0,
      needsAttention: 0,
    };

    for (const row of data || []) {
      if (stats[row.status] !== undefined) {
        stats[row.status]++;
      }
      if (row.status !== 'healthy') {
        stats.needsAttention++;
      }
    }

    // Calculate average health
    if (stats.total > 0) {
      const avgQuery = await supabase
        .from('relationship_health')
        .select('health_score')
        .eq('user_id', userId);

      if (avgQuery.data && avgQuery.data.length > 0) {
        const sum = avgQuery.data.reduce((acc, row) => acc + row.health_score, 0);
        stats.averageHealth = Math.round(sum / avgQuery.data.length);
      }
    }

    return { success: true, stats };
  } catch (error) {
    console.error('[HEALTH] ❌ Failed to get health stats:', error?.message || error);
    return { success: false, stats: {}, error: error?.message || String(error) };
  }
}
