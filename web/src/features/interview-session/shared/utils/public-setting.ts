export function parseUserPublicSetting(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function isInvalidUserPublicSettingInput(value: unknown): boolean {
  return value !== undefined && parseUserPublicSetting(value) === undefined;
}
