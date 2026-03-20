/**
 * Parse opinions from an unknown value (typically JSON from DB).
 * Returns a typed array of {title, content} objects, or an empty array
 * if the input is not an array or contains invalid entries.
 */
export function parseOpinions(
  opinions: unknown
): Array<{ title: string; content: string }> {
  if (!Array.isArray(opinions)) {
    return [];
  }
  return opinions.filter(
    (item): item is { title: string; content: string } =>
      typeof item === "object" &&
      item !== null &&
      typeof item.title === "string" &&
      typeof item.content === "string"
  );
}
