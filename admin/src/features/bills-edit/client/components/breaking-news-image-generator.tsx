"use client";

import { Download } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  HOUSE_LABELS,
  type OriginatingHouse,
} from "@/features/bills/shared/types";
import {
  BREAKING_NEWS_RESULTS,
  BREAKING_NEWS_TITLE_MAX_LINES,
  type BreakingNewsResult,
  type BreakingNewsStance,
  buildBreakingNewsImagePath,
  buildBreakingNewsStepLabels,
  defaultReachedStep,
  isReachedStepAllowed,
  parseBreakingNewsImageInput,
  suggestBreakingNewsTitleLines,
} from "../../shared/utils/breaking-news-image";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
} from "../../shared/utils/share-image";

const PREVIEW_DEBOUNCE_MS = 600;

interface BreakingNewsImageGeneratorProps {
  billId: string;
  originatingHouse: OriginatingHouse;
  defaultTitle: string;
  publishedStance: BreakingNewsStance | null;
}

export function BreakingNewsImageGenerator({
  billId,
  originatingHouse,
  defaultTitle,
  publishedStance,
}: BreakingNewsImageGeneratorProps) {
  const [result, setResult] = useState<BreakingNewsResult>("可決");
  const [reachedStep, setReachedStep] = useState(defaultReachedStep("可決"));
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })
  );
  const [place, setPlace] = useState(
    `${HOUSE_LABELS[originatingHouse]} 本会議`
  );
  const [title, setTitle] = useState(() =>
    suggestBreakingNewsTitleLines(defaultTitle)
  );
  const [includeStance, setIncludeStance] = useState(publishedStance !== null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const stepLabels = buildBreakingNewsStepLabels(originatingHouse);
  const validation = parseBreakingNewsImageInput({
    originatingHouse,
    result,
    reachedStep: String(reachedStep),
    date,
    place,
    title,
    includeStance,
    publishedStance,
  });

  const isValid = validation.ok;

  useEffect(() => {
    if (!isValid) {
      setImagePath(null);
      return;
    }
    const timer = setTimeout(() => {
      setPreviewFailed(false);
      setImagePath(
        buildBreakingNewsImagePath({
          billId,
          result,
          reachedStep,
          date,
          place,
          title,
          includeStance,
        })
      );
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isValid, billId, result, reachedStep, date, place, title, includeStance]);

  const handleResultChange = (value: string) => {
    const next = BREAKING_NEWS_RESULTS.find((r) => r === value);
    if (!next) return;
    setResult(next);
    setReachedStep(defaultReachedStep(next));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>採決結果の速報画像</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          成立・可決・否決・廃案をXなどで速報するときの画像を作ります。議案には保存されません。出す前に衆議院・参議院の議案経過で結果を確かめてください。
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="breaking-news-result">結果</Label>
            <Select value={result} onValueChange={handleResultChange}>
              <SelectTrigger id="breaking-news-result">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BREAKING_NEWS_RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breaking-news-reached-step">
              進み具合（否決・廃案は止まったところ）
            </Label>
            <Select
              value={String(reachedStep)}
              onValueChange={(value) => setReachedStep(Number(value))}
            >
              <SelectTrigger id="breaking-news-reached-step">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stepLabels.map((label, index) =>
                  isReachedStepAllowed(result, index, stepLabels.length) ? (
                    <SelectItem key={label} value={String(index)}>
                      {label}
                    </SelectItem>
                  ) : null
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breaking-news-date">日付</Label>
            <Input
              id="breaking-news-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breaking-news-place">場所</Label>
            <Input
              id="breaking-news-place"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="衆議院 本会議"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breaking-news-title">タイトル</Label>
          <Textarea
            id="breaking-news-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-h-[80px]"
          />
          <p className="text-sm text-muted-foreground">
            初期値は「ふつう」のタイトルです。改行した位置で折り返します（
            {BREAKING_NEWS_TITLE_MAX_LINES}行まで）。
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="breaking-news-stance"
            checked={includeStance}
            onCheckedChange={(checked) => setIncludeStance(checked === true)}
            disabled={!publishedStance}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="breaking-news-stance">
              チームみらいの賛否を入れる
              {publishedStance && `（${publishedStance.label}）`}
            </Label>
            <p className="text-sm text-muted-foreground">
              {publishedStance
                ? "公開中の賛否を画像の下に入れます。"
                : "公開中の賛否が無いので入れられません。賛否を公開すると選べます。"}
            </p>
          </div>
        </div>

        {!validation.ok && (
          <p className="text-sm text-destructive">{validation.error}</p>
        )}

        {imagePath && (
          <div className="space-y-2">
            <Label>プレビュー</Label>
            <Image
              src={imagePath}
              alt="速報画像のプレビュー"
              width={SHARE_IMAGE_WIDTH}
              height={SHARE_IMAGE_HEIGHT}
              unoptimized
              onError={() => setPreviewFailed(true)}
              className="w-full max-w-xl rounded-lg border"
            />
            {previewFailed && (
              <p className="text-sm text-destructive">
                プレビューの生成に失敗しました
              </p>
            )}
          </div>
        )}

        {imagePath && !previewFailed ? (
          <Button asChild variant="outline">
            <a href={imagePath} download={`sokuho_${result}_${date}.png`}>
              <Download className="h-4 w-4 mr-2" />
              画像をダウンロード
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            画像をダウンロード
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
