import type { Database } from "@mirai-gikai/supabase";

type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
type MiraiStanceInsert =
  Database["public"]["Tables"]["mirai_stances"]["Insert"];
type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
type BillsTagsInsert = Database["public"]["Tables"]["bills_tags"]["Insert"];
type DietSessionInsert =
  Database["public"]["Tables"]["diet_sessions"]["Insert"];
type InterviewConfigInsert =
  Database["public"]["Tables"]["interview_configs"]["Insert"];
type InterviewQuestionInsert =
  Database["public"]["Tables"]["interview_questions"]["Insert"];
type InterviewSessionInsert =
  Database["public"]["Tables"]["interview_sessions"]["Insert"];
type InterviewMessageInsert =
  Database["public"]["Tables"]["interview_messages"]["Insert"];
type InterviewReportInsert =
  Database["public"]["Tables"]["interview_report"]["Insert"];

// 国会会期データ
export const dietSessions: DietSessionInsert[] = [
  {
    name: "第219回国会（臨時会）",
    slug: "219-rinji",
    shugiin_url:
      "https://www.shugiin.go.jp/internet/itdb_gian.nsf/html/gian/menu.htm",
    start_date: "2025-10-21",
    end_date: "2025-12-17",
  },
  {
    name: "第218回国会（臨時会）",
    slug: "218-rinji",
    shugiin_url:
      "https://www.shugiin.go.jp/internet/itdb_gian.nsf/html/gian/menu.htm",
    start_date: "2025-08-01",
    end_date: "2025-08-05",
  },
];

// タグデータ
export const tags: TagInsert[] = [
  {
    label: "エネルギー・環境",
    description: "エネルギー政策、環境保護、気候変動対策に関する法案",
    featured_priority: 1,
  },
  {
    label: "子育て・教育",
    description: "子育て支援、教育政策、若者支援に関する法案",
    featured_priority: 2,
  },
  {
    label: "選挙・政治改革",
    description: "選挙制度、政治改革、民主主義の強化に関する法案",
    featured_priority: 3,
  },
];

export const bills: BillInsert[] = [
  {
    name: "ガソリン税暫定税率廃止法案",
    originating_house: "HR",
    status: "in_originating_house",
    status_note: "衆議院で審議中",
    published_at: "2025-08-01T09:00:00+09:00",
    publish_status: "published",
    is_featured: true,
  },
  {
    name: "こども家庭庁予算大幅増額法案",
    originating_house: "HC",
    status: "enacted",
    status_note: "両院で可決、成立",
    published_at: "2025-01-20T10:00:00+09:00",
    publish_status: "published",
    is_featured: true,
  },
  {
    name: "18歳選挙権完全実施法案",
    originating_house: "HR",
    status: "rejected",
    status_note: "衆議院で否決",
    published_at: "2025-02-01T09:00:00+09:00",
    publish_status: "published",
    is_featured: false,
  },
  {
    name: "学校給食無償化促進法案",
    originating_house: "HC",
    status: "enacted",
    status_note: "両院で可決、4月から実施",
    published_at: "2025-01-10T09:00:00+09:00",
    publish_status: "published",
    is_featured: false,
  },
  // 第218回国会用の追加法案（デザイン確認用）- ループで生成
  ...Array.from({ length: 4 }, (_, i) => ({
    name: `学校給食無償化促進法案（第${i + 2}号）`,
    originating_house: (i % 2 === 0 ? "HR" : "HC") as "HR" | "HC",
    status: (i % 2 === 0 ? "enacted" : "in_originating_house") as
      | "enacted"
      | "in_originating_house",
    status_note: i % 2 === 0 ? "両院で可決、成立" : "参議院で審議中",
    published_at: `2025-08-0${i + 1}T09:00:00+09:00`,
    publish_status: "published" as const,
    is_featured: false,
  })),
  {
    name: "中学生・高校生向けプログラミング教育必修化法案",
    originating_house: "HR",
    status: "rejected",
    status_note: "衆議院本会議で否決",
    published_at: "2024-11-15T10:00:00+09:00",
    publish_status: "published",
    is_featured: false,
  },
];

// 議案とタグの関連付け
// billsの順番: [ガソリン税, こども家庭庁, 18歳選挙権, 学校給食, プログラミング教育]
// tagsの順番: [エネルギー・環境, 子育て・教育, 選挙・政治改革]
export function createBillsTags(
  insertedBills: { id: string; name: string }[],
  insertedTags: { id: string; label: string }[]
): Omit<BillsTagsInsert, "id" | "created_at">[] {
  const billTagMap: { [billName: string]: string[] } = {
    "ガソリン税暫定税率廃止法案": ["エネルギー・環境"],
    "こども家庭庁予算大幅増額法案": ["子育て・教育"],
    "18歳選挙権完全実施法案": ["選挙・政治改革"],
    "学校給食無償化促進法案": ["子育て・教育"],
    // 第218回国会用の追加法案（デザイン確認用）
    ...Object.fromEntries(
      Array.from({ length: 4 }, (_, i) => [
        `学校給食無償化促進法案（第${i + 2}号）`,
        ["子育て・教育"],
      ])
    ),
    "中学生・高校生向けプログラミング教育必修化法案": ["子育て・教育"],
  };

  const billsTags: Omit<BillsTagsInsert, "id" | "created_at">[] = [];

  for (const bill of insertedBills) {
    const tagLabels = billTagMap[bill.name] || [];
    for (const tagLabel of tagLabels) {
      const tag = insertedTags.find((t) => t.label === tagLabel);
      if (tag) {
        billsTags.push({
          bill_id: bill.id,
          tag_id: tag.id,
        });
      }
    }
  }

  return billsTags;
}

const miraiStancesData: Omit<MiraiStanceInsert, "bill_id">[] = [
  {
    // ガソリン税暫定税率廃止法案に対する見解
    type: "for",
    comment: `私たちは、家計の負担を軽くするこの法案に賛成します。

特に車が必要な地方の人たちには大きなメリットがあります。ただし、環境問題や道路整備の予算についても同時に考える必要があります。

電気自動車の普及促進など、環境に優しい対策もセットで進めるべきです。`,
  },
  {
    // こども家庭庁予算大幅増額法案に対する見解
    type: "for",
    comment: `少子化対策は国の最重要課題の一つです。この法案による児童手当の増額と保育の無償化は、子育て世代の経済的負担を大幅に軽減します。

特に第3子以降への手厚い支援は、出生率向上に効果的だと考えます。財源確保についても企業の子ども支援金など、社会全体で支える仕組みが評価できます。`,
  },
  {
    // 18歳選挙権完全実施法案に対する見解
    type: "for",
    comment: `18歳選挙権が導入されても、若者の投票率が低いままでは意味がありません。

この法案による主権者教育の充実と投票環境の改善は、民主主義の質を高める重要な取り組みです。デジタルネイティブ世代に合わせた情報提供の現代化も評価できます。`,
  },
  {
    // 学校給食無償化促進法案に対する見解
    type: "for",
    comment: `学校給食の無償化は、子育て支援と教育の充実を同時に実現する重要な政策です。

全ての子どもが質の高い食事を平等に受けられることは、健康格差の解消にもつながります。地産地消の推進により地域経済の活性化も期待できます。`,
  },
  // 第218回国会用の追加法案（デザイン確認用）- 同じ見解を4件追加
  ...Array.from({ length: 4 }, () => ({
    type: "for" as const,
    comment: `学校給食の無償化は、子育て支援と教育の充実を同時に実現する重要な政策です。

全ての子どもが質の高い食事を平等に受けられることは、健康格差の解消にもつながります。地産地消の推進により地域経済の活性化も期待できます。`,
  })),
  {
    // プログラミング教育必修化法案に対する見解
    type: "against",
    comment: `デジタル人材の育成は重要ですが、準備不足での拙速な必修化には反対です。

教員の養成、設備の整備、カリキュラムの検討など、十分な準備期間が必要です。段階的な導入を検討し、質の高いプログラミング教育を実現すべきです。`,
  },
];

export function createMiraiStances(
  insertedBills: { id: string; name: string }[]
): MiraiStanceInsert[] {
  return miraiStancesData.map((stance, index) => ({
    ...stance,
    bill_id: insertedBills[index]?.id || "",
  }));
}

// インタビュー設定を作成（最初の法案用）
export function createInterviewConfig(
  insertedBills: { id: string; name: string }[]
): Omit<InterviewConfigInsert, "id" | "created_at" | "updated_at"> | null {
  const targetBill = insertedBills[0];
  if (!targetBill) return null;

  return {
    bill_id: targetBill.id,
    name: "デフォルト設定",
    status: "public",
    themes: ["賛否", "理由"],
    knowledge_source: `この法案についてあなたの意見を聞かせてください。`,
  };
}

// インタビュー質問を作成
export function createInterviewQuestions(
  interviewConfigId: string
): Omit<InterviewQuestionInsert, "id" | "created_at" | "updated_at">[] {
  return [
    {
      interview_config_id: interviewConfigId,
      question: "この法案に賛成ですか？反対ですか？",
      follow_up_guide: "ユーザーの立場を明確にしてください。",
      quick_replies: ["賛成", "反対", "どちらでもない"],
      question_order: 1,
    },
    {
      interview_config_id: interviewConfigId,
      question: "その理由を教えてください。",
      follow_up_guide: "具体的な理由を引き出してください。",
      quick_replies: null,
      question_order: 2,
    },
  ];
}

// インタビューセッションを作成（5パターン × 20回 = 100件）
export function createInterviewSessions(
  interviewConfigId: string
): Omit<InterviewSessionInsert, "id" | "created_at" | "updated_at">[] {
  const now = new Date();
  const sessions: Omit<
    InterviewSessionInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  // 20回ループして100件作成
  for (let i = 0; i < 20; i++) {
    const baseOffset = i * 86400000 * 3; // 3日ずつずらす

    // パターン1: 完了 + レポートあり（賛成）- 最初の5件は公開
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 1).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 3600000).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 3000000
      ).toISOString(),
      is_public_by_user: i < 5, // 最初の5件は公開
    });

    // パターン2: 完了 + レポートあり（反対）- 最初の5件は公開
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 2).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 7200000).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 6600000
      ).toISOString(),
      is_public_by_user: i < 5, // 最初の5件は公開
    });

    // パターン3: 完了 + レポートあり（中立）- 最初の5件は公開
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 3).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 10800000).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 10200000
      ).toISOString(),
      is_public_by_user: i < 5, // 最初の5件は公開
    });

    // パターン4: 完了したけどレポート未作成
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 4).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 14400000).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 13800000
      ).toISOString(),
      is_public_by_user: false,
    });

    // パターン5: 進行中（未完了、レポートなし）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 5).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 1800000).toISOString(),
      completed_at: null,
      is_public_by_user: false,
    });
  }

  return sessions;
}

// インタビューメッセージを作成（5パターンをループ）
export function createInterviewMessages(
  sessionIds: string[]
): Omit<InterviewMessageInsert, "id" | "created_at">[] {
  const conversations = [
    // パターン1: 賛成（完了 + レポートあり）
    [
      { role: "assistant" as const, content: "この法案に賛成ですか？反対ですか？" },
      { role: "user" as const, content: "賛成です" },
      { role: "assistant" as const, content: "その理由を教えてください。" },
      { role: "user" as const, content: "なぜなら賛成だからです。国民のためになると思います。" },
      { role: "assistant" as const, content: "ありがとうございました。ご意見を承りました。" },
    ],
    // パターン2: 反対（完了 + レポートあり）
    [
      { role: "assistant" as const, content: "この法案に賛成ですか？反対ですか？" },
      { role: "user" as const, content: "反対です" },
      { role: "assistant" as const, content: "その理由を教えてください。" },
      { role: "user" as const, content: "財源が不明確だと思います。" },
      { role: "assistant" as const, content: "ありがとうございました。ご意見を承りました。" },
    ],
    // パターン3: どちらでもない（完了 + レポートあり）
    [
      { role: "assistant" as const, content: "この法案に賛成ですか？反対ですか？" },
      { role: "user" as const, content: "どちらでもないです" },
      { role: "assistant" as const, content: "その理由を教えてください。" },
      { role: "user" as const, content: "もっと情報が必要だと思います。" },
      { role: "assistant" as const, content: "ありがとうございました。ご意見を承りました。" },
    ],
    // パターン4: 完了したけどレポート未作成
    [
      { role: "assistant" as const, content: "この法案に賛成ですか？反対ですか？" },
      { role: "user" as const, content: "賛成です" },
      { role: "assistant" as const, content: "その理由を教えてください。" },
      { role: "user" as const, content: "良い法案だと思います。" },
      { role: "assistant" as const, content: "ありがとうございました。ご意見を承りました。" },
    ],
    // パターン5: 進行中（途中で離脱）
    [
      { role: "assistant" as const, content: "この法案に賛成ですか？反対ですか？" },
      { role: "user" as const, content: "うーん、ちょっと考えさせてください" },
    ],
  ];

  const messages: Omit<InterviewMessageInsert, "id" | "created_at">[] = [];

  sessionIds.forEach((sessionId, sessionIndex) => {
    // 5パターンをループ
    const patternIndex = sessionIndex % 5;
    const conversation = conversations[patternIndex];
    conversation.forEach((msg) => {
      messages.push({
        interview_session_id: sessionId,
        role: msg.role,
        content: msg.content,
      });
    });
  });

  return messages;
}

// インタビューレポートを作成（パターン1,2,3のみ = 5の倍数で0,1,2番目）
export function createInterviewReports(
  sessionIds: string[]
): Omit<InterviewReportInsert, "id" | "created_at" | "updated_at">[] {
  const reportTemplates = [
    {
      stance: "for" as const,
      summary: "この法案に賛成。国民のためになると考えている。",
      role: "general_citizen" as const,
      role_description: "法案の内容に賛同する市民",
      opinions: [{ title: "賛成理由", content: "国民のためになる" }],
    },
    {
      stance: "against" as const,
      summary: "財源の不明確さを理由に反対。",
      role: "work_related" as const,
      role_description: "財政面を懸念する市民",
      opinions: [{ title: "反対理由", content: "財源が不明確" }],
    },
    {
      stance: "neutral" as const,
      summary: "判断するにはより多くの情報が必要と考えている。",
      role: "subject_expert" as const,
      role_description: "慎重な判断を求める市民",
      opinions: [{ title: "態度保留理由", content: "情報不足" }],
    },
  ];

  const reports: Omit<
    InterviewReportInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  // パターン1,2,3（5の倍数で0,1,2番目）のみレポートを作成
  // パターン4: 完了したけどレポート未作成
  // パターン5: 進行中（レポートなし）
  sessionIds.forEach((sessionId, index) => {
    const patternIndex = index % 5;
    if (patternIndex < 3) {
      reports.push({
        interview_session_id: sessionId,
        ...reportTemplates[patternIndex],
      });
    }
  });

  return reports;
}

// デモ用の固定ID
export const DEMO_SESSION_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_REPORT_ID = "00000000-0000-0000-0000-000000000001";

// 4種類のロールを確認するためのデモ用ID
export const DEMO_SESSION_ID_WORK = "00000000-0000-0000-0000-000000000002";
export const DEMO_SESSION_ID_DAILY = "00000000-0000-0000-0000-000000000003";
export const DEMO_SESSION_ID_CITIZEN = "00000000-0000-0000-0000-000000000004";
export const DEMO_REPORT_ID_WORK = "00000000-0000-0000-0000-000000000002";
export const DEMO_REPORT_ID_DAILY = "00000000-0000-0000-0000-000000000003";
export const DEMO_REPORT_ID_CITIZEN = "00000000-0000-0000-0000-000000000004";

// デモ用のインタビューセッション（公開、固定ID）
export function createDemoSession(
  interviewConfigId: string
): InterviewSessionInsert {
  const now = new Date();
  return {
    id: DEMO_SESSION_ID,
    interview_config_id: interviewConfigId,
    user_id: "00000000-0000-0000-0000-000000000000",
    started_at: new Date(now.getTime() - 3600000).toISOString(),
    completed_at: new Date(now.getTime() - 3000000).toISOString(),
    is_public_by_user: true,
  };
}

// デモ用のインタビューメッセージ
export function createDemoMessages(): Omit<
  InterviewMessageInsert,
  "id" | "created_at"
>[] {
  return [
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。\n\nチームみらいは今後1年で達成することをまとめた「1年プラン」を策定しようとしています。今後のチームみらいに期待する内容や、アイデア、意見について率直なご意見をお聞かせください。今後、チームみらいはどのようなことを達成してゆくと良いと思いますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "user",
      content: "国会や省庁デジタル化や、ムダの削減を達成して欲しい",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "なるほど。省庁のレスポンス速度の向上と、官僚の長時間労働の削減を通じて、より優秀な人材が官僚志望になる好循環を期待されているということですね。とても重要な指摘だと思います。\n\nそうした官僚の働き方改革や人材確保という視点から見たとき、チームみらいの100日プランで実現した「みらい議会」や「みらいまるみえ政治資金」といった取り組みは、今のあなたの期待にどの程度応えていると評価されますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "user",
      content:
        "省庁のレスポンスの速さや、官僚の長時間労働が削減され、よりよい人材が官僚になっていく事を期待しています。",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
  ];
}

// デモ用のインタビューレポート（固定ID）
export function createDemoReport(): InterviewReportInsert {
  return {
    id: DEMO_REPORT_ID,
    interview_session_id: DEMO_SESSION_ID,
    stance: "neutral",
    summary: "期待と懸念両方がある",
    role: "subject_expert",
    role_description:
      "中国航路担当のフォワーダー実務者\n業界経験20年\n船荷証券（B/L）手続きに日常的に関与",
    opinions: [
      {
        title: "国会や省庁デジタル化や、ムダの削減を達成して欲しい",
        content:
          "省庁のレスポンスの速さや、官僚の長時間労働が削減され、よりよい人材が官僚になっていく事を期待している。",
      },
    ],
  };
}

// 追加のデモ用セッション（3種類のロール確認用）
export function createAdditionalDemoSessions(
  interviewConfigId: string
): InterviewSessionInsert[] {
  const now = new Date();
  return [
    {
      id: DEMO_SESSION_ID_WORK,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000010",
      started_at: new Date(now.getTime() - 7200000).toISOString(),
      completed_at: new Date(now.getTime() - 6600000).toISOString(),
      is_public_by_user: true,
    },
    {
      id: DEMO_SESSION_ID_DAILY,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000011",
      started_at: new Date(now.getTime() - 10800000).toISOString(),
      completed_at: new Date(now.getTime() - 10200000).toISOString(),
      is_public_by_user: true,
    },
    {
      id: DEMO_SESSION_ID_CITIZEN,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000012",
      started_at: new Date(now.getTime() - 14400000).toISOString(),
      completed_at: new Date(now.getTime() - 13800000).toISOString(),
      is_public_by_user: true,
    },
  ];
}

// 追加のデモ用メッセージ（3種類のロール確認用）
export function createAdditionalDemoMessages(): Omit<
  InterviewMessageInsert,
  "id" | "created_at"
>[] {
  return [
    // work_related セッション用
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content: "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "user",
      content: "ガソリン価格の高騰で物流コストが上がっています。この法案には賛成です。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content: "物流業界で働かれている立場からのご意見ですね。具体的にどのような影響がありますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "user",
      content: "運送会社を経営していますが、燃料費が経営を圧迫しています。暫定税率廃止で少しでも負担が減れば助かります。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
    // daily_life_affected セッション用
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content: "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "user",
      content: "地方在住で車が生活必需品なので、ガソリン代が下がるのは嬉しいです。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content: "生活への影響が大きいとのことですね。どのような場面で車を使われますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "user",
      content: "通勤や買い物、子供の送り迎えなど、毎日使っています。公共交通機関がほとんどない地域なので。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
    // general_citizen セッション用
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content: "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "user",
      content: "環境問題も気になりますが、今の物価高を考えると減税は必要だと思います。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content: "環境と経済のバランスを考えていらっしゃるのですね。どのような点が気になりますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "user",
      content: "ガソリン車から電気自動車への移行も進めつつ、当面の生活支援として減税があってもいいと思います。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
  ];
}

// 追加のデモ用レポート（3種類のロール確認用）
export function createAdditionalDemoReports(): InterviewReportInsert[] {
  return [
    {
      id: DEMO_REPORT_ID_WORK,
      interview_session_id: DEMO_SESSION_ID_WORK,
      stance: "for",
      summary: "物流コスト削減のため賛成",
      role: "work_related",
      role_description:
        "運送会社経営者\n従業員50名規模\n燃料費高騰の影響を直接受けている",
      opinions: [
        {
          title: "燃料費が経営を圧迫している",
          content:
            "運送会社を経営しているが、燃料費が経営を圧迫している。暫定税率廃止で少しでも負担が減れば助かる。",
        },
      ],
    },
    {
      id: DEMO_REPORT_ID_DAILY,
      interview_session_id: DEMO_SESSION_ID_DAILY,
      stance: "for",
      summary: "地方在住者として生活必需品のガソリン代軽減を期待",
      role: "daily_life_affected",
      role_description:
        "地方在住の主婦\n車が唯一の移動手段\n子育て中で送り迎えに車を使用",
      opinions: [
        {
          title: "車が生活必需品",
          content:
            "通勤や買い物、子供の送り迎えなど毎日車を使っている。公共交通機関がほとんどない地域なのでガソリン代が下がると助かる。",
        },
      ],
    },
    {
      id: DEMO_REPORT_ID_CITIZEN,
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      stance: "neutral",
      summary: "環境と経済のバランスを考慮して判断",
      role: "general_citizen",
      role_description: "会社員\n環境問題に関心あり\n電気自動車への乗り換えを検討中",
      opinions: [
        {
          title: "環境と経済のバランス",
          content:
            "ガソリン車から電気自動車への移行も進めつつ、当面の生活支援として減税があってもいいと考える。",
        },
      ],
    },
  ];
}
