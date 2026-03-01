"use client";

import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";
import type { ReactNode } from "react";
import type { ReportReactionData } from "../../shared/types";
import { ReactionButtonsInline } from "./reaction-buttons-inline";

interface CardReactionData {
  reportId: string;
  reactionData: ReportReactionData;
}

interface ReportCardWithReactionsProps {
  billId: string;
  cards: CardReactionData[];
  children: ReactNode[];
}

/**
 * 匿名認証を1回だけ初期化し、各レポートカードにインラインリアクションを付与するクライアントラッパー
 */
export function ReportCardWithReactions({
  billId,
  cards,
  children,
}: ReportCardWithReactionsProps) {
  useAnonymousSupabaseUser();

  return (
    <div className="flex flex-col gap-4">
      {cards.map((card, index) => (
        <div key={card.reportId} className="flex flex-col">
          {children[index]}
          <div className="bg-white rounded-b-lg px-4 pb-3 -mt-1">
            <ReactionButtonsInline
              reportId={card.reportId}
              billId={billId}
              initialData={card.reactionData}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
