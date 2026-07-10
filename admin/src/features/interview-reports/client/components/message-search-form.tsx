"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MESSAGE_SEARCH_STANCE_FILTER_OPTIONS,
  ROLE_FILTER_OPTIONS,
} from "../../shared/constants";
import type {
  MessageSearchFilterConfig,
  MessageSearchStanceFilter,
  RoleFilter,
} from "../../shared/types";
import { appendMessageSearchFilterParams } from "../../shared/utils/parse-message-search-filter-params";
import { FilterSelect } from "./filter-select";

interface MessageSearchFormProps {
  initialQuery: string;
  initialFilters: MessageSearchFilterConfig;
}

export function MessageSearchForm({
  initialQuery,
  initialFilters,
}: MessageSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] =
    useState<MessageSearchFilterConfig>(initialFilters);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    } else {
      params.delete("q");
    }
    appendMessageSearchFilterParams(params, {
      ...filters,
      roleTitle: filters.roleTitle.trim(),
    });

    // 検索条件変更時はページを1にリセット
    params.delete("page");

    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ユーザーの発言を検索"
          aria-label="発言検索キーワード"
          className="max-w-md"
        />
        <Button type="submit">
          <Search className="h-4 w-4" />
          検索
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <FilterSelect
          label="スタンス"
          value={filters.stance}
          options={MESSAGE_SEARCH_STANCE_FILTER_OPTIONS}
          onChange={(stance) =>
            setFilters({
              ...filters,
              stance: stance as MessageSearchStanceFilter,
            })
          }
        />
        <FilterSelect
          label="役割"
          value={filters.role}
          options={ROLE_FILTER_OPTIONS}
          onChange={(role) =>
            setFilters({ ...filters, role: role as RoleFilter })
          }
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            役割名
          </span>
          <Input
            value={filters.roleTitle}
            onChange={(event) =>
              setFilters({ ...filters, roleTitle: event.target.value })
            }
            placeholder="例: 医師（部分一致）"
            aria-label="役割名フィルタ"
            className="w-[200px]"
          />
        </div>
      </div>
    </form>
  );
}
