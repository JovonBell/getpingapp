import { supabase } from '../lib/supabase';

async function upsertImportedContacts(userId, contacts) {
  const rows = (contacts || []).map((c) => ({
    user_id: userId,
    contact_id: String(c.id),
    name: c.name || 'Unknown',
    initials: c.initials || null,
    email: c.email || null,
    phone: c.phone || null,
    matched_user_id: c.matchedUserId || null,
  }));

  if (rows.length === 0) return { success: true, rows: [] };

  const { data, error } = await supabase
    .from('imported_contacts')
    .upsert(rows, { onConflict: 'user_id,contact_id' })
    .select('id,contact_id,name,initials,email,phone,matched_user_id');

  if (error) throw error;
  return { success: true, rows: data || [] };
}

export async function createCircleWithMembers(userId, { name, tier, contacts }) {
  try {
    if (!userId) return { success: false, error: 'Missing userId' };
    if (!name) return { success: false, error: 'Missing circle name' };

    // Ensure imported contacts exist in DB and get their UUIDs
    const upserted = await upsertImportedContacts(userId, contacts || []);
    const byContactId = (upserted.rows || []).reduce((acc, r) => {
      acc[String(r.contact_id)] = r.id;
      return acc;
    }, {});

    // Create circle for this tier (upsert so tier is stable)
    const { data: circle, error: circleErr } = await supabase
      .from('circles')
      .upsert(
        { user_id: userId, name, tier },
        { onConflict: 'user_id,tier' }
      )
      .select('id,name,tier')
      .single();

    if (circleErr) throw circleErr;

    // Insert members (upsert/ignore duplicates)
    const memberRows = (contacts || [])
      .map((c) => byContactId[String(c.id)])
      .filter(Boolean)
      .map((imported_contact_id) => ({
        circle_id: circle.id,
        imported_contact_id,
      }));

    if (memberRows.length > 0) {
      const { error: memErr } = await supabase
        .from('circle_members')
        .upsert(memberRows, { onConflict: 'circle_id,imported_contact_id' });
      if (memErr) throw memErr;
    }

    return { success: true, circleId: circle.id };
  } catch (error) {
    console.warn('createCircleWithMembers failed:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

export async function loadCirclesWithMembers(userId) {
  try {
    console.log('[LOAD CIRCLES] Loading circles for userId:', userId);
    
    if (!userId) {
      console.error('[LOAD CIRCLES] ❌ Missing userId');
      return { success: false, error: 'Missing userId', circles: [] };
    }

    const { data: circles, error: cErr } = await supabase
      .from('circles')
      .select('id,name,tier,created_at')
      .eq('user_id', userId)
      .order('tier', { ascending: true });

    if (cErr) {
      console.error('[LOAD CIRCLES] ❌ Error fetching circles:', cErr);
      throw cErr;
    }
    
    console.log('[LOAD CIRCLES] Found', circles?.length || 0, 'circles in Supabase:');
    circles?.forEach(c => {
      console.log('  - Circle:', c.id, '|', c.name, '| tier:', c.tier);
    });
    
    const circleIds = (circles || []).map((c) => c.id);
    if (circleIds.length === 0) {
      console.log('[LOAD CIRCLES] ✅ No circles found (user has deleted all)');
      return { success: true, circles: [] };
    }

    const { data: members, error: mErr } = await supabase
      .from('circle_members')
      .select('circle_id,imported_contact_id')
      .in('circle_id', circleIds);

    if (mErr) throw mErr;

    const contactIds = Array.from(new Set((members || []).map((m) => m.imported_contact_id).filter(Boolean)));
    const { data: imported, error: iErr } = await supabase
      .from('imported_contacts')
      .select('id,contact_id,name,initials,email,phone')
      .in('id', contactIds);

    if (iErr) throw iErr;

    const importedById = (imported || []).reduce((acc, c) => {
      acc[c.id] = {
        id: String(c.contact_id),
        name: c.name,
        initials: c.initials || '',
        email: c.email || '',
        phone: c.phone || '',
        matchedUserId: c.matched_user_id || null,
      };
      return acc;
    }, {});

    const membersByCircle = (members || []).reduce((acc, m) => {
      if (!acc[m.circle_id]) acc[m.circle_id] = [];
      const c = importedById[m.imported_contact_id];
      if (c) acc[m.circle_id].push(c);
      return acc;
    }, {});

    const result = (circles || []).map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      contacts: membersByCircle[c.id] || [],
    }));

    console.log('[LOAD CIRCLES] ✅ Returning', result.length, 'circles to app');
    result.forEach(c => {
      console.log('  - Circle:', c.name, '| tier:', c.tier, '| contacts:', c.contacts.length);
    });

    return { success: true, circles: result };
  } catch (error) {
    console.error('[LOAD CIRCLES] ❌❌❌ LOAD FAILED:', error?.message || error);
    return { success: false, error: error?.message || String(error), circles: [] };
  }
}

export async function deleteCircle(circleId) {
  try {
    console.log('[DELETE CIRCLE] Starting deletion for circleId:', circleId);
    
    if (!circleId) {
      console.error('[DELETE CIRCLE] ❌ Missing circleId');
      return { success: false, error: 'Missing circleId' };
    }

    // Delete circle members first (foreign key constraint)
    console.log('[DELETE CIRCLE] Step 1: Deleting circle members...');
    const { data: deletedMembers, error: membersErr } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .select();

    if (membersErr) {
      console.error('[DELETE CIRCLE] ❌ Failed to delete members:', membersErr);
      throw membersErr;
    }
    console.log('[DELETE CIRCLE] ✅ Deleted', deletedMembers?.length || 0, 'circle members');

    // Delete the circle
    console.log('[DELETE CIRCLE] Step 2: Deleting circle...');
    const { data: deletedCircle, error: circleErr } = await supabase
      .from('circles')
      .delete()
      .eq('id', circleId)
      .select();

    if (circleErr) {
      console.error('[DELETE CIRCLE] ❌ Failed to delete circle:', circleErr);
      throw circleErr;
    }
    console.log('[DELETE CIRCLE] ✅ Deleted circle:', deletedCircle);

    console.log('[DELETE CIRCLE] ✅✅✅ CIRCLE PERMANENTLY DELETED FROM SUPABASE');
    return { success: true };
  } catch (error) {
    console.error('[DELETE CIRCLE] ❌❌❌ DELETE FAILED:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

