/**
 * Format a citation label from source URLs.
 * Displays the hostname of the first source, and "+N" if there are more.
 * Returns "unknown" if no sources are provided.
 */
export function formatCitationLabel(sources: string[]): string {
  if (sources.length === 0) {
    return "unknown";
  }
  const hostname = new URL(sources[0]).hostname;
  if (sources.length > 1) {
    return `${hostname} +${sources.length - 1}`;
  }
  return hostname;
}
