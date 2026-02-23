"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type InterviewConfig,
  type InterviewConfigInput,
  interviewConfigSchema,
  arrayToText,
  textToArray,
} from "../../shared/types";
import {
  CHAT_MODEL_GROUPS,
  DEFAULT_MODEL_LABEL,
} from "../../shared/utils/chat-model-options";
import { generateDefaultConfigName } from "../../shared/utils/default-config-name";
import {
  createInterviewConfig,
  updateInterviewConfig,
} from "../../server/actions/upsert-interview-config";
import { generateInterviewPreviewUrl } from "../../server/actions/generate-interview-preview-url";

interface InterviewConfigFormProps {
  billId: string;
  config: InterviewConfig | null;
  aiGeneratedThemes?: string[] | null;
  onAiThemesApplied?: () => void;
  onConfigCreated?: (configId: string) => Promise<void>;
  getFormValuesRef?: MutableRefObject<
    | (() => {
        name: string;
        knowledge_source: string;
        mode: string;
        themes: string[];
        chat_model: string | null;
        estimated_duration: number | null;
      })
    | null
  >;
}

export function InterviewConfigForm({
  billId,
  config,
  aiGeneratedThemes,
  onAiThemesApplied,
  onConfigCreated,
  getFormValuesRef,
}: InterviewConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isNew = !config;

  const form = useForm<InterviewConfigInput>({
    resolver: zodResolver(interviewConfigSchema),
    defaultValues: {
      name: config?.name || generateDefaultConfigName(),
      status: config?.status || "closed",
      mode: config?.mode || "loop",
      themes: config?.themes || [],
      knowledge_source: config?.knowledge_source || "",
      chat_model: config?.chat_model || null,
      estimated_duration: config?.estimated_duration ?? null,
    },
  });

  // 親コンポーネントからフォーム値を読み取れるようにする
  useEffect(() => {
    if (getFormValuesRef) {
      getFormValuesRef.current = () => {
        const values = form.getValues();
        return {
          name: values.name,
          knowledge_source: values.knowledge_source || "",
          mode: values.mode,
          themes: values.themes || [],
          chat_model: values.chat_model || null,
          estimated_duration: values.estimated_duration ?? null,
        };
      };
    }
  }, [form, getFormValuesRef]);

  // AI生成テーマの反映
  useEffect(() => {
    if (aiGeneratedThemes && aiGeneratedThemes.length > 0) {
      form.setValue("themes", aiGeneratedThemes, { shouldDirty: true });
      onAiThemesApplied?.();
      toast.success(`AIが${aiGeneratedThemes.length}件のテーマを設定しました`);
    }
  }, [aiGeneratedThemes, form, onAiThemesApplied]);

  const handleSubmit = async (data: InterviewConfigInput) => {
    setIsSubmitting(true);
    try {
      const result = isNew
        ? await createInterviewConfig(billId, data)
        : await updateInterviewConfig(config.id, data);

      if (result.success) {
        if (isNew) {
          // 新規作成時: 質問があればコールバックで保存してから遷移
          if (onConfigCreated) {
            await onConfigCreated(result.data.id);
          }
          toast.success("インタビュー設定を作成しました");
          router.push(`/bills/${billId}/interview/${result.data.id}/edit`);
        } else {
          toast.success("インタビュー設定を保存しました");
          router.refresh();
        }
      } else {
        toast.error(result.error || "エラーが発生しました");
      }
    } catch (error) {
      console.error("Error submitting interview config:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isPreviewing, setIsPreviewing] = useState(false);
  const handlePreview = async () => {
    if (!config) {
      toast.error("プレビューは設定保存後に利用できます");
      return;
    }

    // プレビューの前に保存を実行
    const data = form.getValues();
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("入力内容を確認してください");
      return;
    }

    setIsPreviewing(true);
    try {
      // 1. 保存
      const saveResult = await updateInterviewConfig(config.id, data);
      if (!saveResult.success) {
        toast.error(saveResult.error || "保存に失敗しました");
        return;
      }

      // 2. プレビューURL生成
      const result = await generateInterviewPreviewUrl(billId);

      if (result.success && result.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error(result.error || "プレビューURLの生成に失敗しました");
      }
    } catch (error) {
      console.error("Preview URL generation failed:", error);
      toast.error("プレビューURLの生成中にエラーが発生しました");
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="space-y-4">
      {config && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isPreviewing}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewing ? "準備中..." : "プレビュー"}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>インタビュー設定</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>設定名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例: デフォルト設定、A/Bテスト用など"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      設定を識別するための名前を入力してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">公開（有効）</SelectItem>
                        <SelectItem value="closed">非公開（無効）</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      インタビュー機能の有効/無効を設定します。公開設定は法案ごとに1つのみ可能です。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>インタビューモード</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="モードを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="loop">逐次深掘り（loop）</SelectItem>
                        <SelectItem value="bulk">一括深掘り（bulk）</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      loop: 質問ごとに深掘り / bulk:
                      事前定義質問を先にすべて消化してから深掘り
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chat_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AIモデル</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "__default__" ? null : value)
                      }
                      value={field.value ?? "__default__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="モデルを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__default__">
                          デフォルト（{DEFAULT_MODEL_LABEL}）
                        </SelectItem>
                        {CHAT_MODEL_GROUPS.map((group) => (
                          <SelectGroup key={group.provider}>
                            <SelectLabel>{group.provider}</SelectLabel>
                            {group.options.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                                {option.estimatedCost && (
                                  <span className="ml-2 text-muted-foreground">
                                    {option.estimatedCost}/回
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      インタビュー対話に使用するAIモデルを選択します。コストは1インタビューあたりの推定値です。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目安時間（分）</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例: 15"
                        min={1}
                        max={180}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(
                            val === "" ? null : Number.parseInt(val, 10)
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      設定するとインタビュー中に残り時間が表示されます。未設定の場合は時間制限なしです。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>質問テーマ</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="質問テーマを改行区切りで入力"
                        className="min-h-[100px] resize-y"
                        value={arrayToText(field.value)}
                        onChange={(e) => {
                          field.onChange(textToArray(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      質問テーマを1行ずつ入力してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="knowledge_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ナレッジソース</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="議案の詳細情報やチームみらいの仮説などの情報を入力"
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      AIが質問を生成する際に参照する情報を入力してください。法案コンテンツは自動で読み込まれます。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
