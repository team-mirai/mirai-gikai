"use client";

import { ChevronDown, ChevronUp, Plus, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import {
  MAX_PERSONA_SLOTS,
  RECOMMENDED_PERSONA_SLOTS,
} from "../../shared/constants";
import type {
  CompletedReportListItem,
  PersonaSlotInput,
} from "../../shared/types";
import { PersonaSlotCard } from "./persona-slot-card";

interface PersonaSelectorListProps {
  slots: PersonaSlotInput[];
  onChange: (next: PersonaSlotInput[]) => void;
  /** この config に紐づく billId（UI では特に使わないが、将来スコープ切替で使うかも） */
  billId: string;
  /** この config の ID */
  currentConfigId: string;
  /** 法案配下の全完了レポート（config_id 付き） */
  completedReports: CompletedReportListItem[];
  completedReportsTruncated?: boolean;
  completedReportsLimit?: number;
  disabled?: boolean;
}

/**
 * 複数ペルソナの選択 UI。現在のスロット一覧 + 追加コントロール。
 */
export function PersonaSelectorList({
  slots,
  onChange,
  currentConfigId,
  completedReports,
  completedReportsTruncated = false,
  completedReportsLimit,
  disabled,
}: PersonaSelectorListProps) {
  const reportLookup = useMemo(
    () => new Map(completedReports.map((r) => [r.reportId, r])),
    [completedReports]
  );

  const selectedReportIds = useMemo(
    () =>
      new Set(
        slots
          .filter(
            (s): s is { kind: "report"; reportId: string } =>
              s.kind === "report"
          )
          .map((s) => s.reportId)
      ),
    [slots]
  );

  const [showReportPicker, setShowReportPicker] = useState(false);
  const [reportScope, setReportScope] = useState<"config" | "bill">("bill");

  const visibleReports = useMemo(
    () =>
      reportScope === "config"
        ? completedReports.filter((r) => r.configId === currentConfigId)
        : completedReports,
    [completedReports, currentConfigId, reportScope]
  );

  const canAddMore = slots.length < MAX_PERSONA_SLOTS;
  const showWarning = slots.length > RECOMMENDED_PERSONA_SLOTS;

  const addReportSlot = (reportId: string) => {
    if (selectedReportIds.has(reportId)) return;
    onChange([...slots, { kind: "report", reportId }]);
  };

  const addBillSlot = () => {
    onChange([...slots, { kind: "bill" }]);
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, next: PersonaSlotInput) => {
    onChange(slots.map((s, i) => (i === index ? next : s)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">シミュレートするペルソナ</span>
          <Badge variant="outline" className="font-normal text-xs">
            {slots.length} / {MAX_PERSONA_SLOTS}
          </Badge>
        </div>
      </div>

      {showWarning && (
        <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
          推奨上限（{RECOMMENDED_PERSONA_SLOTS} 件）を超えています。LLM
          コストとレート制限の観点から慎重に。
        </div>
      )}

      {slots.length === 0 ? (
        <div className="text-sm text-muted-foreground italic border rounded-md p-3 bg-muted/30">
          ペルソナがまだ 1
          件も選ばれていません。下のボタンから追加してください。
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, index) => (
            // key に可変値（stanceHint/roleHint）を含めると入力のたびに
            // 再マウントが走って Input のフォーカスが外れるので、index のみで固定。
            // 並べ替え UI を入れるときは slot に stable id を持たせる。
            <PersonaSlotCard
              key={`slot-${index}-${slot.kind}${slot.kind === "report" ? `-${slot.reportId}` : ""}`}
              index={index}
              slot={slot}
              report={
                slot.kind === "report"
                  ? reportLookup.get(slot.reportId)
                  : undefined
              }
              onRemove={() => removeSlot(index)}
              onUpdate={(next) => updateSlot(index, next)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowReportPicker((v) => !v)}
          disabled={disabled || !canAddMore || completedReports.length === 0}
        >
          <Plus className="h-4 w-4" />
          完了レポートから追加
          {showReportPicker ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBillSlot}
          disabled={disabled || !canAddMore}
        >
          <Sparkles className="h-4 w-4" />
          自動生成ペルソナを追加
        </Button>
      </div>

      {showReportPicker && completedReports.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          {completedReportsTruncated && (
            <div className="text-xs text-muted-foreground">
              直近 {completedReportsLimit ?? completedReports.length}{" "}
              件を表示。古いものは含まれていません。
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <Label className="text-xs">対象範囲:</Label>
            <button
              type="button"
              className={`text-xs px-2 py-0.5 rounded ${reportScope === "config" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setReportScope("config")}
            >
              この設定のみ
            </button>
            <button
              type="button"
              className={`text-xs px-2 py-0.5 rounded ${reportScope === "bill" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setReportScope("bill")}
            >
              この法案全体
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1 text-sm">
            {visibleReports.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                対象レポートがありません
              </p>
            ) : (
              visibleReports.map((r) => {
                const checked = selectedReportIds.has(r.reportId);
                const isSlotFull = !canAddMore && !checked;
                const checkboxId = `report-pick-${r.reportId}`;
                return (
                  <Label
                    key={r.reportId}
                    htmlFor={checkboxId}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-background ${isSlotFull ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      disabled={disabled || isSlotFull}
                      onCheckedChange={(v) => {
                        if (v === true) {
                          addReportSlot(r.reportId);
                        } else {
                          const idx = slots.findIndex(
                            (s) =>
                              s.kind === "report" && s.reportId === r.reportId
                          );
                          if (idx >= 0) removeSlot(idx);
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">
                          {r.roleTitle ?? "立場不明"}
                        </span>
                        <StanceBadge stance={r.stance} />
                        {r.totalContentRichness !== null && (
                          <Badge
                            variant="outline"
                            className="font-normal text-xs"
                          >
                            充実度 {r.totalContentRichness}
                          </Badge>
                        )}
                        {reportScope === "bill" && r.configName && (
                          <Badge
                            variant="outline"
                            className="font-normal text-xs"
                          >
                            {r.configName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
