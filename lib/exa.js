/**
 * Exa AI Client for People Search
 * 
 * Uses the free MCP endpoint for development.
 * For production, use the SDK with API key.
 * 
 * @see https://docs.exa.ai/sdks/typescript-sdk-specification
 */

import { supabase } from './supabase';

// Free MCP endpoint (no API key needed for basic usage)
const EXA_MCP_ENDPOINT = 'https://mcp.exa.ai/mcp';

// For production, use Supabase edge function to keep API key secure
const USE_EDGE_FUNCTION = true;

/**
 * Search for people using Exa's people search
 * 
 * @param {string} query - Search query (e.g., "VP of Product at Figma")
 * @param {object} options - Search options
 * @returns {Promise<Array>} - Array of people results
 */
export async function searchPeople(query, options = {}) {
  const {
    numResults = 20,
    includeText = true,
    includeDomains = null,
  } = options;

  if (USE_EDGE_FUNCTION) {
    // Use Supabase edge function (recommended for production)
    try {
      const { data, error } = await supabase.functions.invoke('people-search', {
        body: {
          query,
          category: 'people',
          numResults,
          text: includeText,
          includeDomains,
        },
      });

      if (error) throw error;
      return parseExaResults(data?.results || []);
    } catch (err) {
      console.error('[Exa] Edge function error:', err);
      // Fall back to direct call
      return directExaSearch(query, { numResults, includeText, includeDomains });
    }
  }

  return directExaSearch(query, { numResults, includeText, includeDomains });
}

/**
 * Direct Exa API call (for development/fallback)
 */
async function directExaSearch(query, options) {
  const { numResults, includeText, includeDomains } = options;

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: For production, move API key to edge function
        // 'x-api-key': process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        type: 'auto',
        category: 'people',
        numResults,
        text: includeText,
        ...(includeDomains && { includeDomains }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status}`);
    }

    const data = await response.json();
    return parseExaResults(data?.results || []);
  } catch (err) {
    console.error('[Exa] Direct API error:', err);
    return [];
  }
}

/**
 * Find similar people to a given profile URL
 * 
 * @param {string} url - LinkedIn or profile URL
 * @param {object} options - Search options
 * @returns {Promise<Array>} - Array of similar people
 */
export async function findSimilarPeople(url, options = {}) {
  const { numResults = 20 } = options;

  try {
    const { data, error } = await supabase.functions.invoke('people-similar', {
      body: {
        url,
        numResults,
        excludeSourceDomain: false, // Include LinkedIn results
      },
    });

    if (error) throw error;
    return parseExaResults(data?.results || []);
  } catch (err) {
    console.error('[Exa] Find similar error:', err);
    return [];
  }
}

/**
 * Deep research on a specific person
 * 
 * @param {string} name - Person's name
 * @param {string} context - Additional context (company, role, etc.)
 * @returns {Promise<object>} - Research results
 */
export async function researchPerson(name, context = '') {
  try {
    const { data, error } = await supabase.functions.invoke('research-person', {
      body: {
        name,
        context,
      },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Exa] Research error:', err);
    return null;
  }
}

/**
 * Parse Exa results into normalized person objects
 */
function parseExaResults(results) {
  return results.map(result => ({
    id: result.id || generateId(),
    name: extractName(result),
    linkedinUrl: extractLinkedInUrl(result),
    currentRole: extractRole(result.text || ''),
    company: extractCompany(result.text || ''),
    location: extractLocation(result.text || ''),
    summary: result.text?.slice(0, 500) || '',
    highlights: result.highlights || [],
    url: result.url,
    publishedDate: result.publishedDate,
    score: result.score,
    raw: result,
  }));
}

/**
 * Extract name from result
 */
function extractName(result) {
  const title = result.title || '';
  
  // LinkedIn format: "Name - Title | Company | LinkedIn"
  // Or: "Name | LinkedIn"
  const linkedInMatch = title.match(/^([^-|]+)/);
  if (linkedInMatch) {
    return linkedInMatch[1].trim();
  }
  
  return title.split(' - ')[0].split(' | ')[0].trim() || 'Unknown';
}

/**
 * Extract LinkedIn URL from result
 */
function extractLinkedInUrl(result) {
  if (result.url?.includes('linkedin.com/in/')) {
    return result.url;
  }
  
  // Try to find LinkedIn URL in text
  const text = result.text || '';
  const match = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/);
  return match ? match[0] : null;
}

/**
 * Extract current role from text
 */
function extractRole(text) {
  const patterns = [
    /(?:CEO|CTO|CFO|COO|VP|Director|Manager|Engineer|Head of|Lead|Senior|Principal|Staff)\s+(?:of\s+)?[\w\s]+?(?=\s+at|\s+@|,|\.|\||$)/i,
    /(?:Co-founder|Founder|Partner)\s+(?:&\s+\w+)?/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  
  return null;
}

/**
 * Extract company from text
 */
function extractCompany(text) {
  const patterns = [
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,|•·]|\s+\||\s*$)/,
    /(?:Co-founder|Founder|CEO|CTO)\s+(?:of|at|@)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,|•·]|\s+\||\s*$)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return null;
}

/**
 * Extract location from text
 */
function extractLocation(text) {
  const patterns = [
    /(?:based in|located in|from|📍)\s*([A-Za-z\s,]+?)(?:\s*[|•·]|\s*$)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})/,  // City, ST format
    /(San Francisco|New York|Los Angeles|Seattle|Austin|Boston|Chicago|Miami|Denver|Atlanta)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return null;
}

/**
 * Generate a random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export default {
  searchPeople,
  findSimilarPeople,
  researchPerson,
};
