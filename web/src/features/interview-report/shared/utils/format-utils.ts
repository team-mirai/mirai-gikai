/**
 * Format a roleDescription string into an array of lines.
 * Splits by newlines, trims whitespace, and removes empty lines.
 * When there are multiple lines, ensures each starts with "・".
 * A single line is returned as-is without bullet prefix.
 */
export function formatRoleDescriptionLines(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return lines;
  }

  return lines.map((line) => (line.startsWith("・") ? line : `・${line}`));
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
