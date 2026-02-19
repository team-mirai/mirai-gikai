"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  SelectItem,
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
import { generateDefaultConfigName } from "../../shared/utils/default-config-name";
import {
  createInterviewConfig,
  updateInterviewConfig,
} from "../../server/actions/upsert-interview-config";
import { generateInterviewPreviewUrl } from "../../server/actions/generate-interview-preview-url";

interface InterviewConfigFormProps {
  billId: string;
  config: InterviewConfig | null;
}

export function InterviewConfigForm({
  billId,
  config,
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
    },
  });

  const handleSubmit = async (data: InterviewConfigInput) => {
    setIsSubmitting(true);
    try {
      const result = isNew
        ? await createInterviewConfig(billId, data)
        : await updateInterviewConfig(config.id, data);

      if (result.success) {
        toast.success(
          isNew
            ? "インタビュー設定を作成しました"
            : "インタビュー設定を保存しました"
        );
        if (isNew) {
          router.push(`/bills/${billId}/interview/${result.data.id}/edit`);
        } else {
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
