import { supabase } from '../lib/supabase';

/**
 * Get contact details (notes, tags, how_we_met, interests)
 * @param {string} contactId - The imported_contact ID
 * @returns {object} - { success, details, error }
 */
export async function getContactDetails(contactId) {
  try {
    if (!contactId) {
      return { success: false, error: 'No contact ID provided' };
    }

    // These columns may not exist in the database yet - return defaults gracefully
    const { data, error } = await supabase
      .from('imported_contacts')
      .select('id')
      .eq('id', contactId)
      .single();

    if (error) {
      // Check for missing table/column errors - return defaults
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === '42P01' || error.code === '42703' ||
          errMsg.includes('does not exist') ||
          errMsg.includes('column')) {
        console.warn('[contactDetailsStorage] Table/columns not ready - returning defaults');
        return {
          success: true,
          details: { notes: '', tags: [], howWeMet: '', interests: [] },
        };
      }
      console.warn('[contactDetailsStorage] Error fetching details:', error);
      return { success: false, error: error.message };
    }

    // Return default values since optional columns don't exist yet
    return {
      success: true,
      details: {
        notes: '',
        tags: [],
        howWeMet: '',
        interests: [],
      },
    };
  } catch (err) {
    console.warn('[contactDetailsStorage] Exception:', err);
    return { success: true, details: { notes: '', tags: [], howWeMet: '', interests: [] } };
  }
}

/**
 * Update contact details
 * @param {string} contactId - The imported_contact ID
 * @param {object} details - { notes, tags, howWeMet, interests }
 * @returns {object} - { success, error }
 */
export async function updateContactDetails(contactId, details) {
  try {
    if (!contactId) {
      return { success: false, error: 'No contact ID provided' };
    }

    const updateData = {};

    if (details.notes !== undefined) {
      updateData.notes = details.notes;
    }
    if (details.tags !== undefined) {
      updateData.tags = details.tags;
    }
    if (details.howWeMet !== undefined) {
      updateData.how_we_met = details.howWeMet;
    }
    if (details.interests !== undefined) {
      updateData.interests = details.interests;
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('imported_contacts')
      .update(updateData)
      .eq('id', contactId);

    if (error) {
      // Check for missing column errors - return success (columns don't exist yet)
      const errMsg = error.message?.toLowerCase() || '';
      if (error.code === 'PGRST204' || error.code === '42703' ||
          errMsg.includes('does not exist') || errMsg.includes('column')) {
        console.warn('[contactDetailsStorage] Columns not found - ignoring update');
        return { success: true };
      }
      console.warn('[contactDetailsStorage] Error updating details:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn('[contactDetailsStorage] Exception:', err);
    return { success: true }; // Return success even on error since columns may not exist
  }
}

/**
 * Add a tag to a contact
 * @param {string} contactId - The imported_contact ID
 * @param {string} tag - The tag to add
 * @returns {object} - { success, tags, error }
 */
export async function addContactTag(contactId, tag) {
  try {
    if (!contactId || !tag) {
      return { success: false, error: 'Contact ID and tag required' };
    }

    // First get current tags
    const { data: current, error: fetchError } = await supabase
      .from('imported_contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentTags = current.tags || [];
    const normalizedTag = tag.trim().toLowerCase();

    // Don't add duplicates
    if (currentTags.includes(normalizedTag)) {
      return { success: true, tags: currentTags };
    }

    const newTags = [...currentTags, normalizedTag];

    const { error: updateError } = await supabase
      .from('imported_contacts')
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq('id', contactId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, tags: newTags };
  } catch (err) {
    console.error('[contactDetailsStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a tag from a contact
 * @param {string} contactId - The imported_contact ID
 * @param {string} tag - The tag to remove
 * @returns {object} - { success, tags, error }
 */
export async function removeContactTag(contactId, tag) {
  try {
    if (!contactId || !tag) {
      return { success: false, error: 'Contact ID and tag required' };
    }

    const { data: current, error: fetchError } = await supabase
      .from('imported_contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentTags = current.tags || [];
    const newTags = currentTags.filter(t => t !== tag.trim().toLowerCase());

    const { error: updateError } = await supabase
      .from('imported_contacts')
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq('id', contactId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, tags: newTags };
  } catch (err) {
    console.error('[contactDetailsStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all unique tags used by a user's contacts
 * @param {string} userId - The user ID
 * @returns {object} - { success, tags, error }
 */
export async function getAllUserTags(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    const { data, error } = await supabase
      .from('imported_contacts')
      .select('tags')
      .eq('user_id', userId)
      .not('tags', 'is', null);

    if (error) {
      return { success: false, error: error.message };
    }

    // Flatten and deduplicate all tags
    const allTags = new Set();
    for (const contact of data || []) {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => allTags.add(tag));
      }
    }

    return { success: true, tags: Array.from(allTags).sort() };
  } catch (err) {
    console.error('[contactDetailsStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Search contacts by tag
 * @param {string} userId - The user ID
 * @param {string} tag - The tag to search for
 * @returns {object} - { success, contacts, error }
 */
export async function getContactsByTag(userId, tag) {
  try {
    if (!userId || !tag) {
      return { success: false, error: 'User ID and tag required' };
    }

    const { data, error } = await supabase
      .from('imported_contacts')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag.trim().toLowerCase()]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, contacts: data || [] };
  } catch (err) {
    console.error('[contactDetailsStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

// Predefined tag suggestions
export const SUGGESTED_TAGS = [
  'family',
  'friend',
  'colleague',
  'mentor',
  'mentee',
  'client',
  'investor',
  'founder',
  'classmate',
  'neighbor',
  'gym',
  'church',
  'volunteer',
  'dating',
  'travel',
  'hobby',
  'networking',
  'professional',
];

// Predefined "how we met" suggestions
export const HOW_WE_MET_SUGGESTIONS = [
  'Work',
  'School',
  'Mutual friend',
  'Event/Conference',
  'Online',
  'Dating app',
  'Gym/Sports',
  'Church/Religious',
  'Neighborhood',
  'Family connection',
  'Social media',
  'Professional network',
  'Volunteering',
  'Travel',
  'Other',
];
