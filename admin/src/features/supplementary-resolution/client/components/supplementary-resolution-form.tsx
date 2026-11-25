"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HOUSE_LABELS } from "@/features/bills/shared/types";
import { deleteSupplementaryResolution } from "../../server/actions/delete-supplementary-resolution";
import { saveSupplementaryResolution } from "../../server/actions/save-supplementary-resolution";
import {
  SUPPLEMENTARY_RESOLUTION_STANCE_LABELS,
  type SupplementaryResolution,
  type SupplementaryResolutionHouse,
  type SupplementaryResolutionStance,
  supplementaryResolutionInputSchema,
} from "../../shared/types";

interface SupplementaryResolutionFormProps {
  billId: string;
  house: SupplementaryResolutionHouse;
  resolution: SupplementaryResolution | null;
}

export function SupplementaryResolutionForm({
  billId,
  house,
  resolution,
}: SupplementaryResolutionFormProps) {
  const houseLabel = HOUSE_LABELS[house];
  // 院ごとにフォームを並べるので、ラベルと入力欄の id が重ならないようにする
  const idPrefix = `supplementary-resolution-${house}`;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [referenceUrl, setReferenceUrl] = useState(
    resolution?.reference_url ?? ""
  );
  const [content, setContent] = useState(resolution?.content ?? "");
  const [stance, setStance] = useState<SupplementaryResolutionStance | "">(
    resolution?.stance ?? ""
  );
  const [focusPoints, setFocusPoints] = useState(
    resolution?.focus_points ?? ""
  );
  const [reason, setReason] = useState(resolution?.reason ?? "");
  // 新規は公開で入れる（admin で入力する人は公開するつもりで登録する）。
  // Slack で転記した非公開の附帯決議は、担当議員室が公開確認で公開する
  const [isPublished, setIsPublished] = useState(
    resolution?.is_published ?? true
  );

  const handleSave = () => {
    if (stance === "") {
      toast.error("賛否を選択してください");
      return;
    }
    startTransition(async () => {
      const result = await saveSupplementaryResolution(billId, {
        house,
        referenceUrl,
        content,
        stance,
        focusPoints,
        reason,
        isPublished,
      });
      if (result.success) {
        toast.success(`${houseLabel}の附帯決議を保存しました`);
        router.refresh();
      } else {
        toast.error(result.error || "附帯決議の保存に失敗しました");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`${houseLabel}の附帯決議を削除してもよろしいですか？`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteSupplementaryResolution(billId, house);
      if (result.success) {
        toast.success(`${houseLabel}の附帯決議を削除しました`);
        router.refresh();
      } else {
        toast.error(result.error || "附帯決議の削除に失敗しました");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>附帯決議（{houseLabel}）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-content`}>内容</Label>
            <Textarea
              id={`${idPrefix}-content`}
              value={content}
              rows={6}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-url`}>参考リンク</Label>
            <Input
              id={`${idPrefix}-url`}
              type="url"
              value={referenceUrl}
              placeholder="https://..."
              onChange={(e) => setReferenceUrl(e.target.value)}
              disabled={isPending}
            />
            <p className="text-sm text-gray-500">
              附帯決議の内容を確認できるページのURL
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-stance`}>賛否 *</Label>
            <Select
              value={stance}
              onValueChange={(value) => {
                const parsed =
                  supplementaryResolutionInputSchema.shape.stance.safeParse(
                    value
                  );
                if (parsed.success) setStance(parsed.data);
              }}
              disabled={isPending}
            >
              <SelectTrigger id={`${idPrefix}-stance`}>
                <SelectValue placeholder="賛否を選択" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPLEMENTARY_RESOLUTION_STANCE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-focus-points`}>
              附帯決議で重視した事項
            </Label>
            <Textarea
              id={`${idPrefix}-focus-points`}
              value={focusPoints}
              rows={3}
              onChange={(e) => setFocusPoints(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-reason`}>理由</Label>
            <Textarea
              id={`${idPrefix}-reason`}
              value={reason}
              rows={3}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`${idPrefix}-published`}
              checked={isPublished}
              onCheckedChange={setIsPublished}
              disabled={isPending}
            />
            <Label htmlFor={`${idPrefix}-published`}>
              公開する（オフにすると公開サイトに表示しません）
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "保存中..." : "附帯決議を保存"}
            </Button>
            {resolution && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                削除
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
