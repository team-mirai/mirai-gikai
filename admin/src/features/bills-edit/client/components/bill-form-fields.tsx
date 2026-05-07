"use client";

import { AlertTriangle } from "lucide-react";
import type { Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type BillStatus,
  HOUSE_LABELS,
  type OriginatingHouse,
} from "@/features/bills/shared/types";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import type { BillCreateInput } from "../../shared/types";
import { shouldAutoCloseInterviewOnBillStatus } from "../../shared/utils/should-auto-close-interview";
import { ThumbnailUpload } from "./thumbnail-upload";

const BILL_STATUS_OPTIONS: Array<{ value: BillStatus; label: string }> = [
  { value: "preparing", label: "準備中" },
  { value: "introduced", label: "提出済み" },
  { value: "in_originating_house", label: "審議中（提出院）" },
  { value: "in_receiving_house", label: "審議中（送付院）" },
  { value: "enacted", label: "成立" },
  { value: "rejected", label: "否決" },
];

const ORIGINATING_HOUSE_OPTIONS = Object.entries(HOUSE_LABELS).map(
  ([value, label]) => ({
    value: value as OriginatingHouse,
    label,
  })
);

interface BillFormFieldsProps {
  control: Control<BillCreateInput>;
  billId?: string;
  dietSessions: DietSession[];
}

export function BillFormFields({
  control,
  billId,
  dietSessions,
}: BillFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>議案名 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              議案の正式名称を入力してください（最大200文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ステータス *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BILL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                現在の審議状況を選択してください
              </FormDescription>
              {shouldAutoCloseInterviewOnBillStatus(field.value) && (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded flex items-start gap-2">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <span>
                    保存すると、この議案に紐づく公開中のインタビューは自動でクローズされます。
                  </span>
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="originating_house"
          render={({ field }) => (
            <FormItem>
              <FormLabel>提出院 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="提出院を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ORIGINATING_HOUSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                議案を提出した議院を選択してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="status_note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ステータス備考</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              審議状況の詳細や補足情報を入力してください（最大500文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="submitted_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>法案提出日 *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormDescription>法案の提出日を設定してください</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>サムネイル画像</FormLabel>
            <FormControl>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                billId={billId}
              />
            </FormControl>
            <FormDescription>
              議案のサムネイル画像を設定してください（任意）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="share_thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>シェア用OGP画像</FormLabel>
            <FormControl>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                billId={billId}
                storagePrefix="share"
              />
            </FormControl>
            <FormDescription>
              Twitter等のSNSでシェアされた際に表示される画像を設定してください（任意）。設定しない場合はサムネイル画像が使用されます。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="shugiin_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>衆議院URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                placeholder="https://www.shugiin.go.jp/..."
              />
            </FormControl>
            <FormDescription>
              衆議院の議案ページURLを入力してください（「これから掲載される法案」表示時に外部リンクとして使用）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                placeholder="221-kaku-1-mof-法案名"
              />
            </FormControl>
            <FormDescription>
              コンテンツ同期用の識別子です（最大200文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="diet_session_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>国会会期</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="国会会期を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {dietSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}（{session.start_date}〜{session.end_date}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              議案が提出された国会会期を選択してください
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="is_featured"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>注目の議案</FormLabel>
              <FormDescription>
                トップページなどで優先的に表示されます
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="is_review_completed"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>記事レビュー完了</FormLabel>
              <FormDescription>
                未完了の場合、記事にレビュー中バナーが表示されます
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="knowledge_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ナレッジソース</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="議案の補足情報やチームみらいの仮説などを入力"
                className="min-h-[200px] resize-y"
              />
            </FormControl>
            <FormDescription>
              AIインタビュー（常時参照）と、AIチャット（下のトグルで参照可否を切替）で使われる補足情報です。最大40,000文字。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="use_knowledge_source_in_chat"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>AIチャットでもナレッジソースを使用する</FormLabel>
              <FormDescription>
                ONにすると、議案ページのAIチャットのシステムプロンプトに上のナレッジソースが追加されます。AIインタビューでは常に使用されます。
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
