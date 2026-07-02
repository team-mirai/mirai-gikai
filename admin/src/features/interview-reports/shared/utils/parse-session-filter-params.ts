import {
  DEFAULT_SESSION_FILTER,
  MODERATION_FILTER_VALUES,
  type ModerationFilter,
  ROLE_FILTER_VALUES,
  type RoleFilter,
  SESSION_STATUS_FILTER_VALUES,
  type SessionFilterConfig,
  type SessionStatusFilter,
  STANCE_FILTER_VALUES,
  type StanceFilter,
  VISIBILITY_FILTER_VALUES,
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
  role?: string,
  moderation?: string
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
    moderation: parseEnum<ModerationFilter>(
      moderation,
      MODERATION_FILTER_VALUES,
      DEFAULT_SESSION_FILTER.moderation
    ),
  };
}
