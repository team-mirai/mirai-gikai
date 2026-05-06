export function parseUserPublicSetting(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
