import { supabase } from '../../lib/supabase';

// Upsert identity hashes for a user (so other people can match them).
// Requires `user_identities` table (added in migration).
export async function upsertUserIdentities(userId, { emailHashes = [], phoneHashes = [] }) {
  try {
    if (!userId) return { success: false, error: 'Missing userId' };

    const rows = [
      ...emailHashes.map((hash) => ({ user_id: userId, type: 'email', hash })),
      ...phoneHashes.map((hash) => ({ user_id: userId, type: 'phone', hash })),
    ];

    if (rows.length === 0) return { success: true, count: 0 };

    const { error } = await supabase
      .from('user_identities')
      .upsert(rows, { onConflict: 'user_id,type,hash', ignoreDuplicates: true });

    if (error) {
      // Handle case where another user already claimed this hash (RLS will block update)
      // This is expected behavior - hash is already in the system for matching
      if (error.code === '42501' || error.message?.includes('RLS')) {
        console.log('[identitiesStorage] Hash already exists for another user (expected)');
        return { success: true, count: 0, note: 'Hash already claimed' };
      }
      throw error;
    }
    return { success: true, count: rows.length };
  } catch (error) {
    console.warn('upsertUserIdentities failed:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function findUsersByHashes(type, hashes) {
  try {
    const list = (hashes || []).filter(Boolean);
    if (list.length === 0) return { success: true, userIds: [] };

    const userIds = new Set();
    const chunkSize = 500;

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('user_identities')
        .select('user_id')
        .eq('type', type)
        .in('hash', chunk);

      if (error) throw error;
      (data || []).forEach((r) => r?.user_id && userIds.add(r.user_id));
    }

    return { success: true, userIds: Array.from(userIds) };
  } catch (error) {
    console.warn('findUsersByHashes failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), userIds: [] };
  }
}

export async function findIdentityMapByHashes(type, hashes) {
  try {
    const list = (hashes || []).filter(Boolean);
    if (list.length === 0) return { success: true, map: {} };

    const map = {};
    const chunkSize = 500;

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('user_identities')
        .select('hash,user_id')
        .eq('type', type)
        .in('hash', chunk);

      if (error) throw error;
      (data || []).forEach((r) => {
        if (r?.hash && r?.user_id) map[r.hash] = r.user_id;
      });
    }

    return { success: true, map };
  } catch (error) {
    console.warn('findIdentityMapByHashes failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), map: {} };
  }
}


