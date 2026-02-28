import "server-only";

import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import type { InterviewConfig } from "../loaders/get-interview-config";
import type { InterviewQuestion } from "@/features/interview-session/shared/types";

interface InterviewDisclosurePageProps {
  billName: string;
  interviewConfig: InterviewConfig;
  questions: InterviewQuestion[];
  systemPrompt: string;
  summaryPrompt: string;
}

function StaticDisclosureSection() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-black leading-[1.5]">
        AIインタビューに関する情報開示
      </h1>
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <h2 className="text-[22px] font-bold text-black leading-[1.64]">
          AIインタビューの透明性および技術仕様に関する開示事項
        </h2>
        <div className="text-xs leading-[1.83] text-black space-y-4">
          <div>
            <p className="font-bold">
              AIインタビューの透明性と技術仕様について
            </p>
            <p className="mt-1">
              本インタビューの実施にあたり、公平性の確保および回答者との信頼関係に基づくAIとの共存を目的として、以下の通り技術仕様および運用方針を開示いたします。
            </p>
          </div>

          <div>
            <p className="font-bold">1. 実施目的</p>
            <p className="mt-1">
              本インタビューを通じて収集された回答データは、今後の政策検討における基礎資料として活用いたします。個人の意見を特定の偏り（バイアス）なく集約し、客観性の高い政策立案に役立てることを目的としています。
            </p>
          </div>

          <div>
            <p className="font-bold">2. 透明性の担保（プロンプトの開示）</p>
            <p className="mt-1">
              AIがブラックボックス化することを回避し、回答者がAIの振る舞いを事前に確認できるよう、AIインタビューアーに設定されている全てのプロンプト（指示書）を以下の通り公開いたします。
            </p>
            <p className="mt-1">
              これにより、質問内容における誘導の有無や、特定の意図への偏りがないことを担保し、安心して参加いただける環境を整えています。
            </p>
          </div>

          <div>
            <p className="font-bold">3. 回答データの取り扱い</p>
            <p className="mt-1">
              収集された回答データの管理および活用については、以下の通り規定します。
            </p>
            <ul className="mt-2 space-y-2 list-none">
              <li>
                <span className="font-bold">AI学習への非利用：</span>
                入力されたデータがAIモデル（Anthropic社等）の学習に再利用されることはありません。
              </li>
              <li>
                <span className="font-bold">活用の範囲：</span>
                回答内容は、党内における政策検討、およびAIを用いた統計的分析に限定して活用いたします。
              </li>
              <li>
                <span className="font-bold">分析プロセスの透明化：</span>
                AIを用いた分析手法およびそのプロセスについては、客観性を担保するため、適宜その詳細を開示するものとします。
              </li>
            </ul>

            <div className="mt-3">
              <p className="font-bold">公開設定に応じた取り扱い：</p>
              <ul className="mt-1 space-y-2 list-none">
                <li>
                  <span className="font-bold">公開を希望しない場合：</span>
                  回答者の承諾なく、原文や個人が特定できる形で外部公開されることはありません。ただし、統計的な集計結果、または個人を特定できない範囲に匿名化した上で、国会答弁等において引用・活用される場合があります。
                </li>
                <li>
                  <span className="font-bold">公開を希望する場合：</span>
                  回答データは「みらい議会」上に掲載され、他のユーザーが閲覧可能な状態で公開されます。これにより、利用者間での意見の共有および議論の活性化を図ります。
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DynamicDisclosureSection({
  billName,
  interviewConfig,
  questions,
  systemPrompt,
  summaryPrompt,
}: InterviewDisclosurePageProps) {
  const chatModel = interviewConfig?.chat_model ?? DEFAULT_INTERVIEW_CHAT_MODEL;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-black leading-[1.5]">
        AIに与えられているプロンプト
      </h1>

      <div className="bg-white rounded-2xl p-6 space-y-4">
        <p className="text-[15px] font-normal text-black leading-[1.87]">
          {billName}に関するAIインタビューにおけるプロンプト
        </p>

        <div className="space-y-2">
          <p className="text-xs font-bold text-black">使用モデル</p>
          <p className="text-xs leading-[1.83] text-black">
            対話エンジンには以下のモデルを採用しています。
          </p>
          <p className="text-xs leading-[1.83] text-black">
            モデル名称： {chatModel}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-black">
            インタビュー用プロンプト（指示書）
          </p>
          <pre className="text-xs leading-[1.83] text-black whitespace-pre-wrap break-words">
            {systemPrompt}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-black">質問リスト</p>
          <pre className="text-xs leading-[1.83] text-black whitespace-pre-wrap break-words">
            {JSON.stringify(
              questions.map((q) => ({
                id: q.id,
                question: q.question,
                question_order: q.question_order,
                ...(q.follow_up_guide
                  ? { follow_up_guide: q.follow_up_guide }
                  : {}),
                ...(q.quick_replies ? { quick_replies: q.quick_replies } : {}),
              })),
              null,
              2
            )}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-black">
            要約・レポート生成用プロンプト（指示書）
          </p>
          <p className="text-xs leading-[1.83] text-black">
            インタビュー終了後、回答内容をレポートにまとめる際にAIに与えられるプロンプトです。
          </p>
          <pre className="text-xs leading-[1.83] text-black whitespace-pre-wrap break-words">
            {summaryPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function InterviewDisclosurePage(props: InterviewDisclosurePageProps) {
  return (
    <div className="flex flex-col gap-8 pb-8 bg-mirai-light-gradient">
      <div className="flex flex-col gap-8 px-4 pt-8 max-w-[370px] mx-auto w-full">
        <StaticDisclosureSection />
        <DynamicDisclosureSection {...props} />
      </div>
    </div>
  );
}
