export function getMessageDisplayText(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null && "text" in parsed) {
      return typeof parsed.text === "string" ? parsed.text : content;
    }
  } catch {
    return content;
  }

  return content;
}
