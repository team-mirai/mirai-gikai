"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SessionFilterConfig } from "../../shared/types";
import { DEFAULT_SESSION_FILTER } from "../../shared/types";

interface SessionFilterBarProps {
  currentFilters: SessionFilterConfig;
}

const STATUS_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "completed", label: "完了" },
  { value: "in_progress", label: "進行中" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "public", label: "公開" },
  { value: "private", label: "非公開" },
] as const;

const STANCE_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "for", label: "賛成" },
  { value: "against", label: "反対" },
  { value: "neutral", label: "中立" },
] as const;

const ROLE_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "subject_expert", label: "専門的な有識者" },
  { value: "work_related", label: "業務に関係" },
  { value: "daily_life_affected", label: "暮らしに影響" },
  { value: "general_citizen", label: "一般的な関心" },
] as const;

export function SessionFilterBar({ currentFilters }: SessionFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleFilterChange(key: keyof SessionFilterConfig, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    // デフォルト値の場合はパラメータを削除
    if (value === DEFAULT_SESSION_FILTER[key]) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // フィルタ変更時はページを1にリセット
    params.delete("page");

    router.replace(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <FilterSelect
        label="ステータス"
        value={currentFilters.status}
        options={STATUS_OPTIONS}
        onChange={(v) => handleFilterChange("status", v)}
      />
      <FilterSelect
        label="公開状態"
        value={currentFilters.visibility}
        options={VISIBILITY_OPTIONS}
        onChange={(v) => handleFilterChange("visibility", v)}
      />
      <FilterSelect
        label="スタンス"
        value={currentFilters.stance}
        options={STANCE_OPTIONS}
        onChange={(v) => handleFilterChange("stance", v)}
      />
      <FilterSelect
        label="役割"
        value={currentFilters.role}
        options={ROLE_OPTIONS}
        onChange={(v) => handleFilterChange("role", v)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
