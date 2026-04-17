"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import type {
  CompletedReportListItem,
  PersonaSlotInput,
} from "../../shared/types";

interface PersonaSlotCardProps {
  index: number;
  slot: PersonaSlotInput;
  report?: CompletedReportListItem;
  onRemove: () => void;
  onUpdate: (next: PersonaSlotInput) => void;
  disabled?: boolean;
}

/**
 * 1 つのペルソナスロットを表示する。
 * - report: 対象レポートの概要（role / stance / 充実度）を表示
 * - bill: stance / role ヒント入力 UI をインラインで表示
 */
export function PersonaSlotCard({
  index,
  slot,
  report,
  onRemove,
  onUpdate,
  disabled,
}: PersonaSlotCardProps) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ペルソナ {index + 1}</span>
            <Badge variant="outline" className="font-normal text-xs">
              {slot.kind === "report" ? "完了レポート" : "自動生成"}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRemove}
          disabled={disabled}
          aria-label="このペルソナを外す"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {slot.kind === "report" ? (
        <div className="space-y-1">
          {report ? (
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="font-medium">
                {report.roleTitle ?? "立場不明"}
              </span>
              <StanceBadge stance={report.stance} />
              {report.totalContentRichness !== null && (
                <Badge variant="outline" className="font-normal text-xs">
                  充実度 {report.totalContentRichness}
                </Badge>
              )}
              {report.configName && (
                <Badge variant="outline" className="font-normal text-xs">
                  {report.configName}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              レポートが見つかりません ({slot.reportId.slice(0, 8)}…)
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label
              htmlFor={`slot-${index}-stance`}
              className="text-xs text-muted-foreground"
            >
              立場（任意）
            </Label>
            <Select
              value={slot.stanceHint ?? "auto"}
              onValueChange={(v) =>
                onUpdate({
                  ...slot,
                  stanceHint:
                    v === "auto"
                      ? undefined
                      : (v as "for" | "against" | "neutral"),
                })
              }
              disabled={disabled}
            >
              <SelectTrigger
                id={`slot-${index}-stance`}
                className="h-8 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自動判定</SelectItem>
                <SelectItem value="for">賛成</SelectItem>
                <SelectItem value="against">反対</SelectItem>
                <SelectItem value="neutral">中立</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`slot-${index}-role`}
              className="text-xs text-muted-foreground"
            >
              役割ヒント（任意）
            </Label>
            <Input
              id={`slot-${index}-role`}
              type="text"
              value={slot.roleHint ?? ""}
              onChange={(e) => onUpdate({ ...slot, roleHint: e.target.value })}
              placeholder="例: 射場運用の民間事業者"
              className="h-8 text-xs"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
