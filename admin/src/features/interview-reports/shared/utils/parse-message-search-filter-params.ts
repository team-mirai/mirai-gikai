import {
  DEFAULT_MESSAGE_SEARCH_FILTER,
  MESSAGE_SEARCH_STANCE_FILTER_VALUES,
  type MessageSearchFilterConfig,
  type MessageSearchStanceFilter,
  ROLE_FILTER_VALUES,
  type RoleFilter,
} from "../types";
import { parseEnum } from "./parse-session-filter-params";

export function parseMessageSearchFilterParams(
  stance?: string,
  role?: string,
  roleTitle?: string
): MessageSearchFilterConfig {
  return {
    stance: parseEnum<MessageSearchStanceFilter>(
      stance,
      MESSAGE_SEARCH_STANCE_FILTER_VALUES,
      DEFAULT_MESSAGE_SEARCH_FILTER.stance
    ),
    role: parseEnum<RoleFilter>(
      role,
      ROLE_FILTER_VALUES,
      DEFAULT_MESSAGE_SEARCH_FILTER.role
    ),
    roleTitle: (roleTitle ?? "").trim(),
  };
}

export function hasReportLevelSearchFilters(
  filters: MessageSearchFilterConfig
): boolean {
  return (
    filters.stance !== "all" ||
    filters.role !== "all" ||
    filters.roleTitle !== ""
  );
}

// フィルタをURLクエリパラメータに書き出す（デフォルト値のパラメータは省略）。
// parseMessageSearchFilterParams と対になるシリアライズ処理
export function appendMessageSearchFilterParams(
  params: URLSearchParams,
  filters: MessageSearchFilterConfig
): void {
  for (const key of ["stance", "role", "roleTitle"] as const) {
    if (filters[key] !== DEFAULT_MESSAGE_SEARCH_FILTER[key]) {
      params.set(key, filters[key]);
    } else {
      params.delete(key);
    }
  }
}
