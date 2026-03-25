/**
 * Format a roleDescription string into an array of bullet-prefixed lines.
 * Splits by newlines, trims whitespace, removes empty lines,
 * and ensures each line starts with "・".
 */
export function formatRoleDescriptionLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => (line.startsWith("・") ? line : `・${line}`));
}

export interface ParsedOpinion {
  title: string;
  content: string;
  source_message_id?: string | null;
}

/**
 * Parse opinions from an unknown value (typically JSON from DB).
 * Returns a typed array of {title, content, source_message_id} objects,
 * or an empty array if the input is not an array.
 */
export function parseOpinions(opinions: unknown): ParsedOpinion[] {
  if (!Array.isArray(opinions)) {
    return [];
  }
  return opinions as ParsedOpinion[];
}
