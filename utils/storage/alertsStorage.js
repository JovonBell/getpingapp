import { supabase } from '../../lib/supabase';
import { getHealthScores } from '../scoring/healthScoring';

// Alert thresholds - only alert once per threshold crossing
const HEALTH_THRESHOLDS = [80, 60, 40];

// Alert messages by threshold
const THRESHOLD_MESSAGES = {
  80: { title: 'Time to reconnect', level: 'cooling' },
  60: { title: 'Relationship cooling down', level: 'at_risk' },
  40: { title: 'Contact needs attention', level: 'cold' },
};

/**
 * Create a new alert
 * @param {string} userId - User ID
 * @param {string} alertType - Type of alert
 * @param {string} title - Alert title
 * @param {string} body - Alert body text
 * @param {string} contactId - Related contact ID (optional)
 * @param {number} threshold - Threshold crossed (optional)
 * @returns {Promise<{success: boolean, alert?: object, error?: string}>}
 */
export async function createAlert(userId, alertType, title, body, contactId = null, threshold = null) {
  try {
    console.log('[ALERTS] Creating alert:', { alertType, title });

    if (!userId || !alertType || !title) {
      return { success: false, error: 'Missing required fields' };
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        alert_type: alertType,
        title: title,
        body: body,
        related_contact_id: contactId,
        threshold_crossed: threshold,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[ALERTS] ✅ Alert created:', data.id);
    return { success: true, alert: data };
  } catch (error) {
    console.error('[ALERTS] ❌ Failed to create alert:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Get all alerts for a user
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Only return unread alerts
 * @returns {Promise<{success: boolean, alerts: Array, error?: string}>}
 */
export async function getAlerts(userId, unreadOnly = false) {
  try {
    if (!userId) {
      return { success: false, alerts: [], error: 'Missing userId' };
    }

    let query = supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      // Check if table/column doesn't exist or FK relationship missing (migration not run)
      const errMsg = error.message?.toLowerCase() || '';
      const isMissingSchema = error.code === '42P01' ||
        error.code === 'PGRST200' ||
        error.code === 'PGRST204' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('relation') ||
        errMsg.includes('schema cache');
      if (isMissingSchema) {
        console.warn('[ALERTS] alerts table/schema not ready - run Phase 3 migration');
        return { success: true, alerts: [] };
      }
      throw error;
    }

    console.log('[ALERTS] Fetched', data?.length || 0, 'alerts');
    return { success: true, alerts: data || [] };
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
      console.warn('[ALERTS] Tables/schema not ready - run Phase 3 migration');
      return { success: true, alerts: [] };
    }
    console.warn('[ALERTS] Failed to get alerts:', error?.message || error);
    return { success: false, alerts: [], error: error?.message || String(error) };
  }
}

/**
 * Get unread alert count
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export async function getUnreadAlertCount(userId) {
  try {
    if (!userId) {
      return { success: false, count: 0, error: 'Missing userId' };
    }

    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

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
        console.warn('[ALERTS] alerts table/schema not ready');
        return { success: true, count: 0 };
      }
      throw error;
    }

    return { success: true, count: count || 0 };
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
      console.warn('[ALERTS] Tables/schema not ready');
      return { success: true, count: 0 };
    }
    console.warn('[ALERTS] Failed to get unread count:', error?.message || error);
    return { success: false, count: 0, error: error?.message || String(error) };
  }
}

/**
 * Mark an alert as read
 * @param {string} alertId - Alert ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAlertRead(alertId) {
  try {
    if (!alertId) {
      return { success: false, error: 'Missing alertId' };
    }

    const { error } = await supabase
      .from('alerts')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;

    console.log('[ALERTS] ✅ Marked alert as read:', alertId);
    return { success: true };
  } catch (error) {
    console.error('[ALERTS] ❌ Failed to mark alert read:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Mark all alerts as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAllAlertsRead(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }

    const { error } = await supabase
      .from('alerts')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    console.log('[ALERTS] ✅ Marked all alerts as read for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('[ALERTS] ❌ Failed to mark all alerts read:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Check if we've already alerted for a specific threshold
 * @param {string} userId - User ID
 * @param {string} contactId - Imported contact ID
 * @param {number} threshold - Threshold value (80, 60, or 40)
 * @returns {Promise<boolean>}
 */
async function hasAlreadyAlerted(userId, contactId, threshold) {
  try {
    const { data, error } = await supabase
      .from('alert_history')
      .select('id')
      .eq('user_id', userId)
      .eq('imported_contact_id', contactId)
      .eq('threshold', threshold)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[ALERTS] Error checking alert history:', error);
    }

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Record that we sent an alert for a threshold
 * @param {string} userId - User ID
 * @param {string} contactId - Imported contact ID
 * @param {number} threshold - Threshold value
 */
async function recordAlertSent(userId, contactId, threshold) {
  try {
    await supabase
      .from('alert_history')
      .upsert({
        user_id: userId,
        imported_contact_id: contactId,
        threshold: threshold,
        alerted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,imported_contact_id,threshold' });
  } catch (error) {
    console.error('[ALERTS] Error recording alert history:', error);
  }
}

/**
 * Check health scores and create alerts for threshold crossings
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, alertsCreated: number, error?: string}>}
 */
export async function checkAndCreateHealthAlerts(userId) {
  try {
    console.log('[ALERTS] Checking health alerts for user:', userId);

    if (!userId) {
      return { success: false, alertsCreated: 0, error: 'Missing userId' };
    }

    // Get all health scores
    const { success, healthScores, error: healthErr } = await getHealthScores(userId);
    if (!success) {
      // If health scores couldn't be retrieved (table might not exist), return gracefully
      console.warn('[ALERTS] Could not get health scores:', healthErr);
      return { success: true, alertsCreated: 0 };
    }

    let alertsCreated = 0;

    for (const health of healthScores) {
      const score = health.health_score;
      const contactId = health.imported_contact_id;
      const contactName = health.contact?.name || 'Contact';

      // Check each threshold
      for (const threshold of HEALTH_THRESHOLDS) {
        // Only alert if score is below threshold
        if (score < threshold) {
          // Check if we already alerted for this threshold
          const alreadyAlerted = await hasAlreadyAlerted(userId, contactId, threshold);

          if (!alreadyAlerted) {
            // Create the alert
            const msg = THRESHOLD_MESSAGES[threshold];
            const body = threshold === 80
              ? `It's been a while since you connected with ${contactName}.`
              : threshold === 60
              ? `Your relationship with ${contactName} is cooling. Consider reaching out!`
              : `${contactName} needs attention - don't let this connection go cold!`;

            await createAlert(
              userId,
              'health_decline',
              msg.title,
              body,
              contactId,
              threshold
            );

            // Record that we alerted
            await recordAlertSent(userId, contactId, threshold);
            alertsCreated++;

            console.log('[ALERTS] Created alert for', contactName, 'at threshold', threshold);
          }
        }
      }
    }

    console.log('[ALERTS] ✅ Created', alertsCreated, 'new alerts');
    return { success: true, alertsCreated };
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
      console.warn('[ALERTS] Tables/schema not ready - run Phase 3 migration');
      return { success: true, alertsCreated: 0 };
    }
    console.warn('[ALERTS] Failed to check health alerts:', error?.message || error);
    return { success: false, alertsCreated: 0, error: error?.message || String(error) };
  }
}

/**
 * Clear alert history for a contact (called when user contacts them)
 * @param {string} userId - User ID
 * @param {string} contactId - Imported contact ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function clearAlertHistory(userId, contactId) {
  try {
    if (!userId || !contactId) {
      return { success: false, error: 'Missing userId or contactId' };
    }

    const { error } = await supabase
      .from('alert_history')
      .delete()
      .eq('user_id', userId)
      .eq('imported_contact_id', contactId);

    if (error) throw error;

    console.log('[ALERTS] ✅ Cleared alert history for contact:', contactId);
    return { success: true };
  } catch (error) {
    console.error('[ALERTS] ❌ Failed to clear alert history:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Delete old read alerts (cleanup)
 * @param {string} userId - User ID
 * @param {number} daysOld - Delete alerts older than this many days
 * @returns {Promise<{success: boolean, deleted: number, error?: string}>}
 */
export async function deleteOldAlerts(userId, daysOld = 30) {
  try {
    if (!userId) {
      return { success: false, deleted: 0, error: 'Missing userId' };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const { data, error } = await supabase
      .from('alerts')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)
      .lt('created_at', cutoff.toISOString())
      .select();

    if (error) throw error;

    const deleted = data?.length || 0;
    console.log('[ALERTS] ✅ Deleted', deleted, 'old alerts');
    return { success: true, deleted };
  } catch (error) {
    console.error('[ALERTS] ❌ Failed to delete old alerts:', error?.message || error);
    return { success: false, deleted: 0, error: error?.message || String(error) };
  }
}
