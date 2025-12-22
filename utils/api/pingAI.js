/**
 * Ping AI - AI-powered conversation suggestions
 * 
 * Generates contextual conversation starters based on:
 * - Contact's recent activity (LinkedIn, Twitter)
 * - Shared interests and connections
 * - Time since last interaction
 * - User's stated goal for the connection
 */

import { supabase } from '../../lib/supabase';

/**
 * Fetch an AI-generated conversation suggestion for a contact
 * 
 * @param {string} contactId - The contact's ID
 * @param {object} context - Additional context for generation
 * @returns {Promise<object>} - { suggestion, source, confidence }
 */
export async function fetchPingQuestion(contactId, context = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ping-question', {
      body: {
        contactId,
        context: {
          lastInteraction: context.lastInteraction,
          sharedInterests: context.sharedInterests,
          recentActivity: context.recentActivity,
          goalType: context.goalType,
          ...context,
        },
      },
    });

    if (error) {
      console.error('[PingAI] Error fetching suggestion:', error);
      return getFallbackSuggestion(context);
    }

    return {
      suggestion: data?.suggestion || getFallbackSuggestion(context).suggestion,
      source: data?.source || 'ai',
      confidence: data?.confidence || 0.5,
      reasoning: data?.reasoning,
    };
  } catch (err) {
    console.error('[PingAI] Exception:', err);
    return getFallbackSuggestion(context);
  }
}

/**
 * Generate multiple suggestions for a contact
 * 
 * @param {string} contactId - The contact's ID
 * @param {object} context - Additional context
 * @param {number} count - Number of suggestions to generate
 * @returns {Promise<Array>} - Array of suggestions
 */
export async function fetchMultipleSuggestions(contactId, context = {}, count = 3) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ping-question', {
      body: {
        contactId,
        context,
        count,
      },
    });

    if (error || !data?.suggestions) {
      return [getFallbackSuggestion(context)];
    }

    return data.suggestions;
  } catch (err) {
    console.error('[PingAI] Exception fetching multiple:', err);
    return [getFallbackSuggestion(context)];
  }
}

/**
 * Get a message template for initiating a path connection
 * 
 * @param {object} pathNode - The connection node in the path
 * @param {object} goal - The goal we're trying to achieve
 * @returns {Promise<string>} - Suggested message
 */
export async function getPathIntroMessage(pathNode, goal) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ping-question', {
      body: {
        contactId: pathNode.contactId,
        context: {
          isPathIntro: true,
          nextInPath: pathNode.nextContact,
          targetPerson: goal.targetName,
          goalType: goal.type,
          goalContext: goal.context,
        },
      },
    });

    if (error || !data?.suggestion) {
      return getPathFallbackMessage(pathNode, goal);
    }

    return data.suggestion;
  } catch (err) {
    console.error('[PingAI] Path intro error:', err);
    return getPathFallbackMessage(pathNode, goal);
  }
}

/**
 * Fallback suggestions when AI is unavailable
 */
function getFallbackSuggestion(context = {}) {
  const { lastInteraction, goalType } = context;
  
  // Calculate days since last interaction
  const daysSince = lastInteraction ? 
    Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)) : 
    null;
  
  // Goal-specific suggestions
  if (goalType === 'job') {
    return {
      suggestion: "Hey! I've been thinking about career moves lately - would love to catch up and hear what you've been working on.",
      source: 'fallback',
      confidence: 0.3,
    };
  }
  
  if (goalType === 'cofounder') {
    return {
      suggestion: "I've been exploring some new ideas and would love to get your perspective. Free for a quick call this week?",
      source: 'fallback',
      confidence: 0.3,
    };
  }
  
  if (goalType === 'mentor') {
    return {
      suggestion: "I really value your insights - would you have time for a coffee chat? I'd love to pick your brain about some challenges I'm facing.",
      source: 'fallback',
      confidence: 0.3,
    };
  }
  
  // Time-based suggestions
  if (daysSince !== null) {
    if (daysSince > 90) {
      return {
        suggestion: "It's been way too long! Would love to reconnect and hear what's new in your world.",
        source: 'fallback',
        confidence: 0.3,
      };
    }
    
    if (daysSince > 30) {
      return {
        suggestion: "Hey! Been thinking about you - how have things been going?",
        source: 'fallback',
        confidence: 0.3,
      };
    }
    
    if (daysSince > 14) {
      return {
        suggestion: "Hope you're doing well! Anything exciting happening on your end?",
        source: 'fallback',
        confidence: 0.3,
      };
    }
  }
  
  // Generic suggestion
  return {
    suggestion: "Hey! How's everything going? Would love to catch up soon.",
    source: 'fallback',
    confidence: 0.2,
  };
}

/**
 * Fallback message for path introductions
 */
function getPathFallbackMessage(pathNode, goal) {
  const { nextContact, relationship } = pathNode;
  const { targetName, type } = goal;
  
  if (relationship === 'worked_together') {
    return `Hey! Hope you're doing well. I'm trying to connect with ${targetName} - I know you two have worked together. Would you be open to making an intro?`;
  }
  
  if (relationship === 'mentor') {
    return `Hey! I remember you mentioned knowing ${targetName}. I'd love to learn from them about ${type}. Would you be comfortable introducing us?`;
  }
  
  return `Hey! I'm hoping to connect with ${targetName}. I believe you might know them - would you be open to introducing us?`;
}

/**
 * Rate a suggestion (for learning)
 * 
 * @param {string} suggestionId - ID of the suggestion
 * @param {number} rating - 1-5 rating
 * @param {boolean} wasUsed - Whether the suggestion was actually used
 */
export async function rateSuggestion(suggestionId, rating, wasUsed = false) {
  try {
    await supabase.from('suggestion_ratings').insert({
      suggestion_id: suggestionId,
      rating,
      was_used: wasUsed,
    });
  } catch (err) {
    console.error('[PingAI] Failed to save rating:', err);
  }
}

export default {
  fetchPingQuestion,
  fetchMultipleSuggestions,
  getPathIntroMessage,
  rateSuggestion,
};
