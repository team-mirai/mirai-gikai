"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2, Sparkles } from "lucide-react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { generateVoiceInstruction } from "../../server/actions/generate-voice-instruction";

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
        voice_enabled: boolean;
        voice_instruction: string;
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
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  const form = useForm<InterviewConfigInput>({
    resolver: zodResolver(interviewConfigSchema),
    defaultValues: {
      name: config?.name || generateDefaultConfigName(),
      status: config?.status || "closed",
      mode: config?.mode || "loop",
      themes: config?.themes || [],
      knowledge_source: config?.knowledge_source || "",
      voice_enabled: config?.voice_enabled ?? false,
      voice_instruction: config?.voice_instruction || "",
    },
  });

  const voiceEnabled = form.watch("voice_enabled");

  const handleGenerateVoiceInstruction = async () => {
    setIsGeneratingVoice(true);
    try {
      const values = form.getValues();
      const result = await generateVoiceInstruction({
        themes: values.themes || [],
        knowledge_source: values.knowledge_source || "",
        mode: values.mode,
      });

      if (!result.success) {
        toast.error(result.error || "音声インタビュー指示の生成に失敗しました");
        return;
      }

      form.setValue("voice_instruction", result.data, {
        shouldDirty: true,
      });
      toast.success("音声インタビュー指示を生成しました");
    } catch (error) {
      console.error("Voice instruction generation failed:", error);
      toast.error("音声インタビュー指示の生成中にエラーが発生しました");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

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
          voice_enabled: values.voice_enabled ?? false,
          voice_instruction: values.voice_instruction || "",
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

              <FormField
                control={form.control}
                name="voice_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        音声インタビュー
                      </FormLabel>
                      <FormDescription>
                        音声によるインタビュー機能を有効にします
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {voiceEnabled && (
                <FormField
                  control={form.control}
                  name="voice_instruction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>音声インタビュー指示</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="音声インタビュー用のシステムプロンプト指示を入力"
                          className="min-h-[200px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        音声インタビューでAIが従う指示を入力してください。テキスト設定から自動生成することもできます。
                      </FormDescription>
                      <FormMessage />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateVoiceInstruction}
                        disabled={isGeneratingVoice}
                      >
                        {isGeneratingVoice ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        {isGeneratingVoice
                          ? "生成中..."
                          : "テキスト設定から生成"}
                      </Button>
                    </FormItem>
                  )}
                />
              )}

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
