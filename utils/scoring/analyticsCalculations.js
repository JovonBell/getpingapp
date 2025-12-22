import { supabase } from '../../lib/supabase';
import { getHealthScores, getStatusFromScore } from './healthScoring';

/**
 * Calculate overall network health score (average of all contact health scores)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, score: number, status: string, trend: number|null, error?: string}>}
 */
export async function getNetworkHealthScore(userId) {
  try {
    if (!userId) {
      return { success: false, score: 0, status: 'unknown', trend: null, error: 'Missing userId' };
    }

    // Get all health scores
    const { success, healthScores } = await getHealthScores(userId);
    if (!success || !healthScores || healthScores.length === 0) {
      return { success: true, score: 100, status: 'healthy', trend: null };
    }

    // Calculate average
    const totalScore = healthScores.reduce((sum, h) => sum + (h.health_score || 0), 0);
    const avgScore = Math.round(totalScore / healthScores.length);
    const status = getStatusFromScore(avgScore);

    // Get trend from yesterday's snapshot
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: snapshot } = await supabase
      .from('health_snapshots')
      .select('average_health')
      .eq('user_id', userId)
      .eq('snapshot_date', yesterdayStr)
      .single();

    const trend = snapshot ? avgScore - snapshot.average_health : null;

    return { success: true, score: avgScore, status, trend };
  } catch (error) {
    console.error('[ANALYTICS] Failed to get network health score:', error);
    return { success: false, score: 0, status: 'unknown', trend: null, error: error?.message };
  }
}

/**
 * Get health distribution counts
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, distribution: object, error?: string}>}
 */
export async function getHealthDistribution(userId) {
  try {
    if (!userId) {
      return { success: false, distribution: {}, error: 'Missing userId' };
    }

    const { success, healthScores } = await getHealthScores(userId);
    if (!success) {
      return { success: false, distribution: {}, error: 'Failed to get health scores' };
    }

    const distribution = {
      total: healthScores?.length || 0,
      healthy: 0,
      cooling: 0,
      at_risk: 0,
      cold: 0,
    };

    for (const h of healthScores || []) {
      const status = h.status || getStatusFromScore(h.health_score);
      if (distribution[status] !== undefined) {
        distribution[status]++;
      }
    }

    return { success: true, distribution };
  } catch (error) {
    console.error('[ANALYTICS] Failed to get health distribution:', error);
    return { success: false, distribution: {}, error: error?.message };
  }
}

/**
 * Get contacts needing attention (sorted by health score ascending)
 * @param {string} userId - User ID
 * @param {number} limit - Max contacts to return
 * @returns {Promise<{success: boolean, contacts: Array, error?: string}>}
 */
export async function getContactsNeedingAttention(userId, limit = 5) {
  try {
    if (!userId) {
      return { success: false, contacts: [], error: 'Missing userId' };
    }

    const { success, healthScores } = await getHealthScores(userId);
    if (!success) {
      return { success: false, contacts: [], error: 'Failed to get health scores' };
    }

    // Filter to non-healthy contacts and sort by score ascending
    const needsAttention = (healthScores || [])
      .filter(h => h.status !== 'healthy')
      .sort((a, b) => (a.health_score || 0) - (b.health_score || 0))
      .slice(0, limit)
      .map(h => ({
        id: h.imported_contact_id,
        name: h.contact?.name || 'Unknown',
        initials: h.contact?.initials || '?',
        phone: h.contact?.phone || '',
        healthScore: h.health_score,
        status: h.status,
        daysSinceContact: h.days_since_contact,
      }));

    return { success: true, contacts: needsAttention };
  } catch (error) {
    console.error('[ANALYTICS] Failed to get contacts needing attention:', error);
    return { success: false, contacts: [], error: error?.message };
  }
}

/**
 * Get health breakdown by circle
 * @param {string} userId - User ID
 * @param {Array} circles - Array of circles with contacts
 * @param {object} healthMap - Map of contact ID to health data
 * @returns {Array} Array of circle health summaries
 */
export function getCircleHealthBreakdown(circles, healthMap) {
  if (!circles || !circles.length) return [];

  return circles.map(circle => {
    const contacts = circle.contacts || [];
    if (contacts.length === 0) {
      return {
        id: circle.id,
        name: circle.name,
        tier: circle.tier,
        contactCount: 0,
        averageHealth: 100,
        status: 'healthy',
      };
    }

    let totalHealth = 0;
    let scoredCount = 0;

    for (const contact of contacts) {
      const health = healthMap[contact.importedContactId];
      if (health && health.health_score !== undefined) {
        totalHealth += health.health_score;
        scoredCount++;
      } else {
        totalHealth += 100; // Default to healthy
        scoredCount++;
      }
    }

    const avgHealth = scoredCount > 0 ? Math.round(totalHealth / scoredCount) : 100;

    return {
      id: circle.id,
      name: circle.name,
      tier: circle.tier,
      contactCount: contacts.length,
      averageHealth: avgHealth,
      status: getStatusFromScore(avgHealth),
    };
  });
}

/**
 * Log an activity for analytics
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity
 * @param {string|null} contactId - Related contact ID (optional)
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logActivity(userId, activityType, contactId = null, metadata = {}) {
  try {
    if (!userId || !activityType) {
      return { success: false, error: 'Missing required fields' };
    }

    const { error } = await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        activity_type: activityType,
        related_contact_id: contactId,
        metadata: metadata,
      });

    if (error) {
      // Check if table doesn't exist (migration not run)
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        console.warn('[ANALYTICS] activity_log table not found - run Phase 4 migration');
        return { success: true }; // Fail silently
      }
      throw error;
    }

    console.log('[ANALYTICS] Activity logged:', activityType);
    return { success: true };
  } catch (error) {
    console.error('[ANALYTICS] Failed to log activity:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Get activity summary for the past N days
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<{success: boolean, summary: object, error?: string}>}
 */
export async function getActivitySummary(userId, days = 7) {
  try {
    if (!userId) {
      return { success: false, summary: {}, error: 'Missing userId' };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('activity_log')
      .select('activity_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      // Check if table doesn't exist
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        console.warn('[ANALYTICS] activity_log table not found');
        return { success: true, summary: { contactsReachedOut: 0, relationshipsImproved: 0, relationshipsCooling: 0 } };
      }
      throw error;
    }

    const summary = {
      contactsReachedOut: 0,
      relationshipsImproved: 0,
      relationshipsCooling: 0,
      messagessSent: 0,
      contactsAdded: 0,
    };

    for (const activity of data || []) {
      switch (activity.activity_type) {
        case 'message_sent':
          summary.contactsReachedOut++;
          summary.messagessSent++;
          break;
        case 'contact_added':
          summary.contactsAdded++;
          break;
        case 'health_improved':
          summary.relationshipsImproved++;
          break;
        case 'health_declined':
          summary.relationshipsCooling++;
          break;
      }
    }

    return { success: true, summary };
  } catch (error) {
    console.error('[ANALYTICS] Failed to get activity summary:', error);
    return { success: false, summary: {}, error: error?.message };
  }
}

/**
 * Create or update today's health snapshot
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function createHealthSnapshot(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }

    // Get current distribution
    const { success, distribution } = await getHealthDistribution(userId);
    if (!success || distribution.total === 0) {
      console.log('[ANALYTICS] No contacts to snapshot');
      return { success: true };
    }

    // Calculate average
    const { score: avgHealth } = await getNetworkHealthScore(userId);
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('health_snapshots')
      .upsert({
        user_id: userId,
        snapshot_date: today,
        average_health: avgHealth,
        total_contacts: distribution.total,
        healthy_count: distribution.healthy,
        cooling_count: distribution.cooling,
        at_risk_count: distribution.at_risk,
        cold_count: distribution.cold,
      }, { onConflict: 'user_id,snapshot_date' });

    if (error) {
      // Check if table or columns don't exist (migration not run)
      const errMsg = error.message?.toLowerCase() || '';
      const isMissingSchema = error.code === '42P01' ||
        error.code === 'PGRST204' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('schema cache');
      if (isMissingSchema) {
        console.warn('[ANALYTICS] health_snapshots table/columns not found - run Phase 4 migration');
        return { success: true };
      }
      throw error;
    }

    console.log('[ANALYTICS] Health snapshot created for:', today);
    return { success: true };
  } catch (error) {
    console.error('[ANALYTICS] Failed to create health snapshot:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Get health trend data for charts
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<{success: boolean, trends: Array, error?: string}>}
 */
export async function getHealthTrends(userId, days = 30) {
  try {
    if (!userId) {
      return { success: false, trends: [], error: 'Missing userId' };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('health_snapshots')
      .select('snapshot_date, average_health, total_contacts, healthy_count, cooling_count, at_risk_count, cold_count')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      // Check if table or columns don't exist (migration not run)
      const errMsg = error.message?.toLowerCase() || '';
      const isMissingSchema = error.code === '42P01' ||
        error.code === 'PGRST204' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('schema cache');
      if (isMissingSchema) {
        console.warn('[ANALYTICS] health_snapshots table/columns not found');
        return { success: true, trends: [] };
      }
      throw error;
    }

    const trends = (data || []).map(row => ({
      date: row.snapshot_date,
      score: row.average_health,
      total: row.total_contacts,
      healthy: row.healthy_count,
      cooling: row.cooling_count,
      atRisk: row.at_risk_count,
      cold: row.cold_count,
    }));

    return { success: true, trends };
  } catch (error) {
    console.error('[ANALYTICS] Failed to get health trends:', error);
    return { success: false, trends: [], error: error?.message };
  }
}

/**
 * Get status label for overall network health
 * @param {number} score - Health score 0-100
 * @returns {string} Human-readable status label
 */
export function getNetworkStatusLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Work';
  if (score >= 40) return 'At Risk';
  return 'Critical';
}
