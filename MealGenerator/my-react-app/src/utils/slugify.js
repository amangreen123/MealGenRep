/**
 * Converts a string to a URL-friendly slug
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slugified text
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-") // Replace spaces and non-word chars with hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

// The getIdFromSlug function is no longer needed since we're not using IDs in the slugs
// We can remove it or keep it for potential future use
