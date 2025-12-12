import { supabase } from '../lib/supabase';

export async function sendMessage(senderId, receiverId, content) {
  try {
    const trimmed = String(content || '').trim();
    if (!senderId || !receiverId) return { success: false, error: 'Missing sender/receiver' };
    if (!trimmed) return { success: false, error: 'Empty message' };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: trimmed,
        read: false,
      })
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, message: data };
  } catch (error) {
    console.warn('sendMessage failed:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function fetchConversation(userId, otherUserId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { success: true, messages: data || [] };
  } catch (error) {
    console.warn('fetchConversation failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), messages: [] };
  }
}

export async function markConversationRead(userId, otherUserId) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
      .eq('read', false);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.warn('markConversationRead failed:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function fetchRecentThreads(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const lastByOther = new Map();
    (data || []).forEach((m) => {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (!lastByOther.has(otherId)) lastByOther.set(otherId, m);
    });

    const threads = Array.from(lastByOther.entries())
      .slice(0, limit)
      .map(([otherUserId, lastMessage]) => ({
        otherUserId,
        lastMessage,
      }));

    // Hydrate names/avatars from profiles
    const otherIds = threads.map((t) => t.otherUserId).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id,display_name,avatar_url')
      .in('user_id', otherIds);

    const byId = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const hydrated = threads.map((t) => ({
      ...t,
      profile: byId[t.otherUserId] || null,
    }));

    return { success: true, threads: hydrated };
  } catch (error) {
    console.warn('fetchRecentThreads failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), threads: [] };
  }
}

export async function getUnreadMessageCount(userId) {
  try {
    const { data, error } = await supabase.rpc('get_unread_message_count', { user_uuid: userId });
    if (error) throw error;
    return { success: true, count: Number(data || 0) };
  } catch (error) {
    console.warn('getUnreadMessageCount failed:', error?.message || error);
    return { success: false, error: error?.message || String(error), count: 0 };
  }
}


