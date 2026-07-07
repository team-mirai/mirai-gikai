export function parseOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function isInvalidOptionalBooleanInput(value: unknown): boolean {
  return value !== undefined && parseOptionalBoolean(value) === undefined;
}
