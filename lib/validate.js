// Upper bounds on user-submitted text. These guard the database and API
// responses against oversized payloads; they are generous enough not to get in
// the way of normal posts.
export const LIMITS = {
  title: 160,
  topic: 160,
  category: 60,
  verdict: 40,
  summary: 5000,
  body: 5000,
  question: 2000,
  comment: 5000
};

// Given a map of { label: { value, max } }, returns a human-readable error for
// the first field that exceeds its limit, or null if all are within bounds.
export function lengthError(fields) {
  for (const [label, { value, max }] of Object.entries(fields)) {
    if (typeof value === "string" && value.length > max) {
      return `${label} is too long (max ${max} characters).`;
    }
  }
  return null;
}
