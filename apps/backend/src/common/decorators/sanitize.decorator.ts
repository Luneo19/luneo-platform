import { Transform } from 'class-transformer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sanitizeHtml = require('sanitize-html') as (
  html: string,
  options?: { allowedTags?: string[]; allowedAttributes?: Record<string, string[]> }
) => string;

const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'];

/**
 * Strips ALL HTML tags from the string.
 * Use for plain text fields that must not contain any markup.
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (value == null || typeof value !== 'string') {
      return value;
    }
    return sanitizeHtml(value, { allowedTags: [] });
  });
}

/**
 * Allows specified HTML tags (default: b, i, em, strong, a, p, br).
 * Use for rich text fields that permit limited formatting.
 */
export function SanitizeHtml(allowedTags: string[] = DEFAULT_ALLOWED_TAGS) {
  return Transform(({ value }) => {
    if (value == null || typeof value !== 'string') {
      return value;
    }
    return sanitizeHtml(value, {
      allowedTags,
      allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
      },
    });
  });
}
