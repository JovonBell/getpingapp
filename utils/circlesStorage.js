import { supabase } from '../lib/supabase';

async function upsertImportedContacts(userId, contacts) {
  console.log('[UPSERT CONTACTS] Starting with', contacts?.length || 0, 'contacts');
  
  const rows = (contacts || []).map((c) => {
    // Ensure contact_id is a clean string
    const contactId = typeof c.id === 'object' ? JSON.stringify(c.id) : String(c.id || '');
    
    return {
      user_id: userId,
      contact_id: contactId,
      name: String(c.name || 'Unknown'),
      initials: c.initials ? String(c.initials) : null,
      email: c.email ? String(c.email) : null,
      phone: c.phone ? String(c.phone) : null,
      matched_user_id: c.matchedUserId || null,
    };
  });

  console.log('[UPSERT CONTACTS] Prepared rows:', rows.length);

  if (rows.length === 0) return { success: true, rows: [] };

  const { data, error } = await supabase
    .from('imported_contacts')
    .upsert(rows, { onConflict: 'user_id,contact_id' })
    .select('id,contact_id,name,initials,email,phone,matched_user_id');

  if (error) {
    console.error('[UPSERT CONTACTS] Error:', error);
    throw error;
  }
  
  console.log('[UPSERT CONTACTS] Success, upserted:', data?.length || 0);
  return { success: true, rows: data || [] };
}

export async function createCircleWithMembers(userId, { name, tier, contacts }) {
  try {
    console.log('[CREATE CIRCLE] Starting:', { userId, name, tier, contactCount: contacts?.length });
    
    if (!userId) return { success: false, error: 'Missing userId' };
    if (!name) return { success: false, error: 'Missing circle name' };

    // Ensure imported contacts exist in DB and get their UUIDs
    const upserted = await upsertImportedContacts(userId, contacts || []);
    const byContactId = (upserted.rows || []).reduce((acc, r) => {
      const key = typeof r.contact_id === 'object' ? JSON.stringify(r.contact_id) : String(r.contact_id);
      acc[key] = r.id;
      return acc;
    }, {});

    console.log('[CREATE CIRCLE] Contacts upserted, mapping:', Object.keys(byContactId).length);

    // Find the next available tier to avoid duplicate key error
    const { data: existingCircles, error: tierQueryErr } = await supabase
      .from('circles')
      .select('tier')
      .eq('user_id', userId)
      .order('tier', { ascending: false })
      .limit(1);
    
    if (tierQueryErr) {
      console.error('[CREATE CIRCLE] Error querying existing circles:', tierQueryErr);
      throw tierQueryErr;
    }
    
    const maxTier = existingCircles?.[0]?.tier ?? -1;
    let nextTier = maxTier + 1;
    console.log('[CREATE CIRCLE] Using tier:', nextTier, '(max was', maxTier, ')');

    // Create circle with next available tier, retry with incremented tier if duplicate
    let circle = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!circle && attempts < maxAttempts) {
      const { data, error: circleErr } = await supabase
        .from('circles')
        .insert({ user_id: userId, name, tier: nextTier })
        .select('id,name,tier')
        .single();

      if (circleErr) {
        // Check if it's a duplicate tier error
        if (circleErr.code === '23505' && circleErr.message?.includes('circles_user_tier_unique')) {
          console.warn('[CREATE CIRCLE] Tier', nextTier, 'already exists, trying tier', nextTier + 1);
          nextTier++;
          attempts++;
          continue;
        }
        
        console.error('[CREATE CIRCLE] Circle insert error:', circleErr);
        throw circleErr;
      }
      
      circle = data;
    }
    
    if (!circle) {
      throw new Error('Failed to create circle after ' + maxAttempts + ' attempts');
    }

    console.log('[CREATE CIRCLE] Circle created:', circle.id);

    // Insert members
    const memberRows = (contacts || [])
      .map((c) => {
        const key = typeof c.id === 'object' ? JSON.stringify(c.id) : String(c.id);
        return byContactId[key];
      })
      .filter(Boolean)
      .map((imported_contact_id) => ({
        circle_id: circle.id,
        imported_contact_id,
      }));

    console.log('[CREATE CIRCLE] Member rows to insert:', memberRows.length);

    if (memberRows.length > 0) {
      const { error: memErr } = await supabase
        .from('circle_members')
        .insert(memberRows);
      if (memErr) {
        console.error('[CREATE CIRCLE] Member insert error:', memErr);
        throw memErr;
      }
    }

    console.log('[CREATE CIRCLE] ✅ Success!');
    return { success: true, circleId: circle.id };
  } catch (error) {
    console.error('[CREATE CIRCLE] ❌ Failed:', error?.message || error);
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

    // Check if this looks like a valid UUID (Supabase uses UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(circleId)) {
      console.log('[DELETE CIRCLE] ⚠️ Not a valid UUID, skipping Supabase delete (local-only circle)');
      return { success: true }; // Return success for local-only deletion
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

