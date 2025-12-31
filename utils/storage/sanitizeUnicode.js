/**
 * Sanitize a string by removing invalid Unicode surrogate pairs
 * This fixes "Unicode low surrogate must follow a high surrogate" errors
 * when sending data to Supabase/PostgreSQL
 *
 * Contact names, messages, and other user-provided strings may contain
 * broken emoji or special characters from phone address books.
 */
export function sanitizeUnicode(str) {
  if (!str || typeof str !== 'string') return str;

  // Process character by character to handle surrogates correctly
  // (Hermes doesn't support lookbehind regex)
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    // Check if it's a high surrogate (0xD800-0xDBFF)
    if (code >= 0xD800 && code <= 0xDBFF) {
      // Check if next char is a valid low surrogate
      if (i + 1 < str.length) {
        const nextCode = str.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          // Valid surrogate pair - keep both
          result += str[i] + str[i + 1];
          i++; // Skip the low surrogate
          continue;
        }
      }
      // Lone high surrogate - skip it
      continue;
    }

    // Check if it's a low surrogate without preceding high surrogate
    if (code >= 0xDC00 && code <= 0xDFFF) {
      // Lone low surrogate - skip it
      continue;
    }

    // Skip problematic control characters
    if (code <= 0x08 || code === 0x0B || code === 0x0C || (code >= 0x0E && code <= 0x1F)) {
      continue;
    }

    result += str[i];
  }

  return result;
}
