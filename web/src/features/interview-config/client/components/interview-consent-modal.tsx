"use client";

import { ArrowRight, MessageSquare, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInterviewChatLink } from "@/features/interview-config/shared/utils/interview-links";
import { prewarmAudioContext } from "@/features/voice-interview/client/utils/audio-context";

const TERMS_MARKDOWN = `本サービスは、AIを活用したインタビュー機能を提供しています。ご利用にあたり、以下の事項にご同意いただく必要があります。

## 1. データの利用目的

お客様の回答内容は、サービスの品質向上、統計分析、および政策立案の参考資料として利用されます。収集したデータは、政策提言の作成、市民の声の分析、およびサービス改善のために活用されます。

## 2. 個人情報の取り扱い

本サービスでは、インタビューを通じて取得した情報を厳重に管理します。個人を特定できる情報（氏名、住所、電話番号、メールアドレス等）の入力はお控えください。万が一、個人情報が含まれる回答があった場合、当該情報は適切に削除または匿名化処理を行います。

## 3. データの保存期間

インタビューデータは、サービス提供および分析目的のために必要な期間保存されます。保存期間終了後は、適切な方法でデータを削除いたします。

## 4. 第三者への提供

収集したデータは、統計的な分析結果として公開される場合があります。ただし、個人を特定できる形での第三者への提供は行いません。学術研究や政策研究のために、匿名化されたデータを提供する場合があります。

## 5. AIによる処理

本サービスでは、人工知能（AI）技術を使用してインタビューを実施し、回答内容を分析します。AIによる処理結果は、人間による確認・検証を経て利用されます。

## 6. 著作権および知的財産権

インタビューを通じて提供された回答内容の著作権は、回答者に帰属します。ただし、サービス提供者は、本サービスの目的の範囲内で、回答内容を利用する権利を有します。

## 7. 免責事項

本サービスは、インタビュー内容に基づく政策提言や分析結果について、その正確性、完全性、有用性を保証するものではありません。サービスの利用により生じた損害について、法令で認められる範囲内で責任を負いません。

## 8. サービスの変更・停止

サービス提供者は、事前の通知なく本サービスの内容を変更、または提供を停止する場合があります。

## 9. 準拠法および管轄裁判所

本規約は日本法に準拠し、本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。

## 10. お問い合わせ

本サービスに関するお問い合わせは、サービス提供者の指定する窓口までご連絡ください。

## 11. 規約の変更

サービス提供者は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上で公開した時点から効力を生じるものとします。

## 12. データセキュリティ

収集したデータは、適切なセキュリティ対策を講じて保護します。不正アクセス、紛失、破壊、改ざん、漏洩などのリスクに対して、技術的および組織的な安全管理措置を実施しています。

## 13. 未成年者の利用

18歳未満の方が本サービスを利用する場合は、保護者の同意を得た上でご利用ください。

## 14. 禁止事項

以下の行為は禁止されています：

- 虚偽の情報を提供する行為
- 他者の権利を侵害する行為
- サービスの運営を妨害する行為
- 法令または公序良俗に反する行為
- その他、サービス提供者が不適切と判断する行為

## 15. 利用環境

本サービスの利用には、インターネット接続環境および対応するウェブブラウザが必要です。推奨環境以外でのご利用については、正常に動作しない場合があります。

以上の規約に同意いただける場合は、「同意してはじめる」ボタンをクリックしてください。`;

interface InterviewConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  previewToken?: string;
  voiceEnabled?: boolean;
}

export function InterviewConsentModal({
  open,
  onOpenChange,
  billId,
  previewToken,
  voiceEnabled = false,
}: InterviewConsentModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const handleAgree = () => {
    if (voiceEnabled) {
      setShowModeSelect(true);
    } else {
      setIsLoading(true);
      router.push(getInterviewChatLink(billId, previewToken));
    }
  };

  const handleSelectMode = (mode?: "voice") => {
    if (mode === "voice") {
      prewarmAudioContext();
    }
    setIsLoading(true);
    router.push(getInterviewChatLink(billId, previewToken, mode));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowModeSelect(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary text-center">
            {showModeSelect ? "回答方法を選択" : "AIインタビュー同意事項"}
          </DialogTitle>
          <div className="h-[1px] bg-mirai-gradient mt-4" />
        </DialogHeader>

        {showModeSelect ? (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              インタビューの回答方法を選んでください
            </p>
            <Button
              onClick={() => handleSelectMode()}
              disabled={isLoading}
              variant="outline"
              className="w-full h-16 flex items-center justify-center gap-3"
            >
              <MessageSquare className="size-5" />
              <div className="text-left">
                <div className="font-bold text-sm">テキストで回答する</div>
                <div className="text-xs text-muted-foreground">
                  チャット形式で入力します
                </div>
              </div>
              <ArrowRight className="ml-auto size-4" />
            </Button>
            <Button
              onClick={() => handleSelectMode("voice")}
              disabled={isLoading}
              variant="outline"
              className="w-full h-16 flex items-center justify-center gap-3"
            >
              <Mic className="size-5" />
              <div className="text-left">
                <div className="font-bold text-sm">音声で回答する</div>
                <div className="text-xs text-muted-foreground">
                  マイクで話して回答します（Chrome/Edge推奨）
                  <br />
                  ※Safari/Firefoxは非対応
                </div>
              </div>
              <ArrowRight className="ml-auto size-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowModeSelect(false)}
              disabled={isLoading}
              className="w-full text-sm"
            >
              戻る
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mt-4">
              <p className="text-sm font-bold">
                回答データは党内での政策検討に利用します。
              </p>
              <p className="text-sm font-bold leading-[22px]">
                インタビュー内容はのちにみらい議会上に公開される場合があります。個人情報および機密情報の記載はお控えください。
              </p>

              <div className="border border-black rounded-lg p-4">
                <ScrollArea className="h-[200px]">
                  <div className="text-gray-700 pr-4 prose prose-sm prose-gray max-w-none prose-headings:text-sm prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                    <Markdown>{TERMS_MARKDOWN}</Markdown>
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <Button
                onClick={handleAgree}
                disabled={isLoading}
                className="w-full"
              >
                {"同意してはじめる"}
                {<ArrowRight className="ml-2 size-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full"
              >
                同意せずに戻る
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
