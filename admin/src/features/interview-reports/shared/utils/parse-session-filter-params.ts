import {
  DEFAULT_SESSION_FILTER,
  ROLE_FILTER_VALUES,
  SESSION_STATUS_FILTER_VALUES,
  STANCE_FILTER_VALUES,
  VISIBILITY_FILTER_VALUES,
  type RoleFilter,
  type SessionFilterConfig,
  type SessionStatusFilter,
  type StanceFilter,
  type VisibilityFilter,
} from "../types";

function parseEnum<T extends string>(
  value: string | undefined,
  validValues: readonly T[],
  defaultValue: T
): T {
  if (value && (validValues as readonly string[]).includes(value)) {
    return value as T;
  }
  return defaultValue;
}

export function parseSessionFilterParams(
  status?: string,
  visibility?: string,
  stance?: string,
  role?: string
): SessionFilterConfig {
  return {
    status: parseEnum<SessionStatusFilter>(
      status,
      SESSION_STATUS_FILTER_VALUES,
      DEFAULT_SESSION_FILTER.status
    ),
    visibility: parseEnum<VisibilityFilter>(
      visibility,
      VISIBILITY_FILTER_VALUES,
      DEFAULT_SESSION_FILTER.visibility
    ),
    stance: parseEnum<StanceFilter>(
      stance,
      STANCE_FILTER_VALUES,
      DEFAULT_SESSION_FILTER.stance
    ),
    role: parseEnum<RoleFilter>(
      role,
      ROLE_FILTER_VALUES,
      DEFAULT_SESSION_FILTER.role
    ),
  };
}
