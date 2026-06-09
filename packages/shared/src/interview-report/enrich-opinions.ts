type MessageForEnrich = {
  id: string;
  role: string;
  content: string;
};

type EnrichedOpinion<T> = T & {
  source_message_id: string | null;
  source_message_content: string | null;
};

/**
 * 意見の source_message_id を元発言（role=user）に解決し、source_message_content を付与する純粋関数。
 * 解決できない id は null に正規化する（保存データの整合性を保つ）。
 * web の完了時保存と admin の再抽出バックフィルで共通利用する。
 */
export function enrichOpinionsWithSourceContent<
  T extends { source_message_id?: string | null },
>(opinions: T[], messages: MessageForEnrich[]): EnrichedOpinion<T>[] {
  return opinions.map((opinion) => {
    if (!opinion.source_message_id) {
      return { ...opinion, source_message_id: null, source_message_content: null };
    }

    const sourceMsg = messages.find(
      (m) => m.id === opinion.source_message_id && m.role === "user"
    );
    if (!sourceMsg) {
      return {
        ...opinion,
        source_message_id: null,
        source_message_content: null,
      };
    }

    return {
      ...opinion,
      source_message_id: opinion.source_message_id,
      source_message_content: sourceMsg.content,
    };
  });
}
