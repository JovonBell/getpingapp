import { supabase } from '../../lib/supabase';

// Create/refresh connections between the current user and matched users.
// Requires a UNIQUE index on (user_id, connected_user_id) for upsert to be idempotent.
export async function upsertConnections(userId, connectedUserIds, ringTier = 3) {
  try {
    const ids = Array.from(new Set((connectedUserIds || []).filter(Boolean))).filter((id) => id !== userId);
    if (!userId) return { success: false, error: 'Missing userId' };
    if (ids.length === 0) return { success: true, count: 0 };

    const rows = ids.map((id) => ({
      user_id: userId,
      connected_user_id: id,
      connection_type: 'contact',
      ring_tier: ringTier,
      status: 'active',
    }));

    const { error } = await supabase
      .from('connections')
      .upsert(rows, { onConflict: 'user_id,connected_user_id' });

    if (error) throw error;
    return { success: true, count: rows.length };
  } catch (error) {
    console.warn('upsertConnections failed:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}




