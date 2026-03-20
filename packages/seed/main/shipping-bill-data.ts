import type { Database } from "@mirai-gikai/supabase";

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

const SHIPPING_BILL_NAME = "船荷証券の電子化に関する法律案";

/**
 * 船荷証券法案のインタビュー設定を作成
 */
export function createShippingBillInterviewConfig(
  insertedBills: { id: string; name: string }[]
): Omit<InterviewConfigInsert, "id" | "created_at" | "updated_at"> | null {
  const bill = insertedBills.find((b) => b.name === SHIPPING_BILL_NAME);
  if (!bill) return null;

  return {
    bill_id: bill.id,
    name: "デフォルト設定",
    status: "public",
    themes: ["電子化の影響", "実務上の課題", "国際整合性"],
    knowledge_source:
      "船荷証券（B/L）の電子化に関する法律案について、あなたの意見を聞かせてください。",
  };
}

/**
 * 船荷証券法案のインタビュー質問を作成
 */
export function createShippingBillQuestions(
  configId: string
): Omit<InterviewQuestionInsert, "id" | "created_at" | "updated_at">[] {
  return [
    {
      interview_config_id: configId,
      question:
        "船荷証券の電子化について、賛成ですか？反対ですか？",
      follow_up_guide:
        "電子化への賛否と、その立場からの懸念点を引き出してください。",
      quick_replies: ["賛成", "反対", "条件付きで賛成"],
      question_order: 1,
    },
    {
      interview_config_id: configId,
      question:
        "電子化によって、あなたの業務や生活にどのような影響がありますか？",
      follow_up_guide:
        "具体的な業務フローの変化やコスト面での影響を掘り下げてください。",
      quick_replies: null,
      question_order: 2,
    },
    {
      interview_config_id: configId,
      question:
        "実施にあたって、どのような課題や不安がありますか？",
      follow_up_guide:
        "技術面、法的面、コスト面などの具体的な課題を聞いてください。",
      quick_replies: null,
      question_order: 3,
    },
  ];
}

/**
 * トピック解析テスト用の多様な意見パターン（各3件のopinions）
 * 10パターン × 10ループ = 100セッション
 */
const opinionPatterns: Array<{
  stance: "for" | "against" | "neutral" | "conditional_for";
  summary: string;
  role:
    | "subject_expert"
    | "work_related"
    | "daily_life_affected"
    | "general_citizen";
  role_description: string;
  opinions: Array<{ title: string; content: string }>;
}> = [
  // パターン1: フォワーダー実務者（賛成・効率化重視）
  {
    stance: "for",
    summary:
      "電子化により船荷証券の処理時間が大幅に短縮され、業務効率が向上する",
    role: "subject_expert",
    role_description:
      "中国航路担当のフォワーダー実務者\n業界経験20年\nB/L手続きに日常的に関与",
    opinions: [
      {
        title: "紙の船荷証券の処理に膨大な時間がかかっている",
        content:
          "現在、紙のB/Lは国際郵便で送付するため、到着まで5〜7営業日かかる。この間、貨物は港で滞留し、デマレージ（超過保管料）が発生することも多い。電子化により即時送付が可能になれば、年間で数千万円のコスト削減が見込める。",
      },
      {
        title: "電子化でヒューマンエラーが減少する",
        content:
          "紙のB/Lでは記載内容の転記ミスが頻繁に発生し、その修正に多大な手間がかかっている。電子化によりデータ入力の自動化・検証が可能になり、ミスの大幅な削減が期待できる。",
      },
      {
        title: "国際的な書類のやり取りが簡素化される",
        content:
          "特に中国やASEAN諸国との取引では、書類の紛失や遅延が頻発する。電子化により瞬時に書類を送受信でき、トラッキングも容易になるため、国際取引の信頼性が大幅に向上する。",
      },
    ],
  },
  // パターン2: 中小船会社経営者（条件付き賛成・コスト懸念）
  {
    stance: "conditional_for",
    summary:
      "電子化の方向性には賛同するが、中小企業の導入コスト支援が不可欠",
    role: "work_related",
    role_description:
      "内航船会社の経営者\n従業員30名\nアジア近距離航路を主に運航",
    opinions: [
      {
        title: "システム導入コストが中小企業にとって大きな負担",
        content:
          "電子B/Lプラットフォームの導入には初期費用で数百万円、月額利用料も数十万円かかると見込まれる。大手船会社には負担できても、我々のような中小企業には大きな出費。補助金や段階的導入の仕組みがなければ、競争力が失われてしまう。",
      },
      {
        title: "取引先の対応状況にバラつきがある",
        content:
          "当社の取引先には東南アジアの小規模港湾も多く、相手国の電子化対応が進んでいない場合、結局紙と電子の二重管理が必要になる。国際的な普及状況も考慮した移行スケジュールを設定すべき。",
      },
      {
        title: "従業員のITリテラシー向上が課題",
        content:
          "ベテランの船員や事務職の中にはITに不慣れな人も多い。電子化に対応するための研修・教育の支援制度が必要。社内の人材育成コストも考慮してほしい。",
      },
    ],
  },
  // パターン3: 貿易保険会社（セキュリティ懸念）
  {
    stance: "neutral",
    summary:
      "電子化のメリットは理解するが、セキュリティと法的効力の担保が最優先",
    role: "subject_expert",
    role_description:
      "貿易保険会社のリスクアナリスト\n海上保険・貿易リスク専門\n法務部門との連携業務",
    opinions: [
      {
        title: "電子B/Lの改ざん・不正リスクへの対策が不十分",
        content:
          "紙のB/Lは物理的な原本管理が可能だが、電子化された場合のサイバー攻撃や改ざんリスクへの対策が法案では十分に示されていない。ブロックチェーン等の技術的担保と、万一の不正発生時の法的責任の明確化が必要。",
      },
      {
        title: "紛争解決時の証拠としての法的効力が不明確",
        content:
          "国際取引では紛争が生じた際にB/Lが重要な証拠となるが、電子B/Lの法的証拠力について、各国の裁判所での扱いが統一されていない。準拠法の整備が不可欠。",
      },
      {
        title: "保険料率の見直しが必要になる",
        content:
          "電子B/Lの導入に伴い、新たなリスク（システム障害、サイバー攻撃等）が生じるため、海上保険の料率体系の見直しが必要。保険業界全体での合意形成に時間がかかる可能性がある。",
      },
    ],
  },
  // パターン4: 港湾労働者（反対・雇用懸念）
  {
    stance: "against",
    summary:
      "電子化により港湾事務職の雇用が失われることを懸念",
    role: "work_related",
    role_description:
      "港湾事務職員\n通関・書類処理業務を担当\n勤続15年",
    opinions: [
      {
        title: "書類処理業務の自動化で雇用が失われる",
        content:
          "現在の港湾事務は船荷証券を含む書類の確認・照合が業務の中心。電子化でこれが自動化されると、私のような事務職員の仕事がなくなる。再就職支援や職業訓練の制度が整備されていないまま進めるのは無責任。",
      },
      {
        title: "地方港湾のインフラが対応できない",
        content:
          "大都市の港湾と違い、地方の中小港湾ではネットワーク環境やIT機器の整備が遅れている。全国一律の電子化は地方港湾を切り捨てることにつながる。",
      },
      {
        title: "現場の声が法案に反映されていない",
        content:
          "法案の策定過程で、実際に港湾で働いている我々の意見が十分に聴取されていない。机上の理想論だけで進めてほしくない。現場実態に即した制度設計を求める。",
      },
    ],
  },
  // パターン5: 国際法学者（賛成・制度整備重視）
  {
    stance: "for",
    summary:
      "MLETR準拠の国内法整備は国際競争力維持のために不可欠",
    role: "subject_expert",
    role_description:
      "海商法・国際取引法の大学教授\nUNCITRAL関連研究\n政府審議会委員",
    opinions: [
      {
        title: "MLETRへの対応は急務",
        content:
          "英国、シンガポール、ドイツなど主要海運国がすでにMLETR（電子的移転可能記録モデル法）に対応した国内法を整備している。日本が遅れると国際取引において不利な立場に置かれ、海運ハブとしての地位が低下する恐れがある。",
      },
      {
        title: "電子B/Lの権利移転メカニズムの法的整備が重要",
        content:
          "紙のB/Lでは裏書・交付による権利移転が確立しているが、電子化においてはこれに相当する確実な権利移転の仕組みを法律で担保する必要がある。本法案の権利移転規定は概ね妥当だが、占有の概念をさらに明確化すべき。",
      },
      {
        title: "既存の国際条約との整合性確保",
        content:
          "ヘーグ・ヴィスビー・ルールズやロッテルダム・ルールズとの整合性は法案の現行の枠組みで概ね確保されている。ただし、米国のCOGSA体系を持つ国との取引については、追加的な解釈指針が必要になる場面も想定される。",
      },
    ],
  },
  // パターン6: ITベンダー（賛成・技術面からの提言）
  {
    stance: "for",
    summary:
      "技術的には十分実現可能。標準化とAPI連携が鍵",
    role: "work_related",
    role_description:
      "物流テック企業のCTO\n電子B/Lプラットフォーム開発経験\nブロックチェーン技術専門",
    opinions: [
      {
        title: "ブロックチェーン技術で原本性の担保は可能",
        content:
          "分散台帳技術を用いれば、電子B/Lの原本性・唯一性を技術的に担保することは十分可能。すでにTradeLensやBolero等のプラットフォームで実用化されている。技術的なハードルは低い。",
      },
      {
        title: "プラットフォーム間の相互運用性確保が最大の技術課題",
        content:
          "複数の電子B/Lプラットフォームが乱立すると、相互運用性の欠如が新たな障壁になる。法律でAPIの標準仕様やデータフォーマットの統一を義務づけるか、業界標準の策定を促進すべき。",
      },
      {
        title: "クラウドインフラの信頼性確保が前提条件",
        content:
          "電子B/Lは24時間365日利用可能でなければならない。システム障害や災害時のBCP（事業継続計画）対策を法律や省令で義務付ける必要がある。99.99%以上の可用性を保証すべき。",
      },
    ],
  },
  // パターン7: 消費者（一般市民の視点）
  {
    stance: "for",
    summary: "物流の効率化により商品の価格低下が期待できる",
    role: "general_citizen",
    role_description:
      "会社員\nECサイトでの海外通販を月数回利用\n物流効率化に関心あり",
    opinions: [
      {
        title: "物流コスト削減による商品価格の低下に期待",
        content:
          "海外から商品を購入する際、通関や物流の遅延で届くまで時間がかかることが多い。電子化で手続きが早くなれば、配送も早くなり、物流コストも下がって商品が安くなることを期待している。",
      },
      {
        title: "環境面でのペーパーレス化にも賛成",
        content:
          "大量の紙書類を国際郵便で送ることは環境負荷も大きい。デジタル化は環境にも優しい選択だと思う。SDGsの観点からも支持できる。",
      },
      {
        title: "配送状況の透明性が向上してほしい",
        content:
          "現状では海外からの荷物がどこにあるのか分からないことが多い。電子化により追跡が容易になり、消費者としても安心して海外通販を利用できるようになることを期待する。",
      },
    ],
  },
  // パターン8: 銀行の貿易金融担当（条件付き賛成）
  {
    stance: "conditional_for",
    summary:
      "L/C決済との連携が円滑にできれば電子化は歓迎",
    role: "subject_expert",
    role_description:
      "メガバンク貿易金融部門\nL/C（信用状）審査担当\n国際決済業務20年",
    opinions: [
      {
        title: "信用状決済における電子B/Lの受け入れ基準が必要",
        content:
          "銀行のL/C決済では、B/Lの原本確認が重要なプロセス。電子B/Lを信用状の呈示書類として受け入れる際の統一基準（eUCP等）との整合性を確保し、銀行業界のガイドラインを事前に策定すべき。",
      },
      {
        title: "電子化は貿易金融のDXを加速させる好機",
        content:
          "B/Lの電子化が実現すれば、L/Cの電子化、さらには貿易金融全体のデジタルトランスフォーメーションが加速する。サプライチェーンファイナンスの高度化にもつながり、金融機関としても前向きに捉えている。",
      },
      {
        title: "AML/CFT（マネーロンダリング対策）との連携",
        content:
          "電子B/Lの導入により、取引の透明性が向上し、マネーロンダリングやテロ資金供与のリスク検知が容易になる。ただし、既存のAMLシステムとの連携方法を早期に確立する必要がある。",
      },
    ],
  },
  // パターン9: 税関職員（実務的な懸念）
  {
    stance: "neutral",
    summary:
      "通関手続きの効率化は期待できるが、システム連携に課題がある",
    role: "work_related",
    role_description:
      "財務省税関職員\n輸出入通関業務担当\nNACCS運用経験",
    opinions: [
      {
        title: "NACCSとの連携が不可欠",
        content:
          "日本の通関はNACCS（通関情報処理システム）で電子化されているが、電子B/Lとの自動連携はまだ実現していない。システム改修には相当な予算と期間が必要で、法施行のスケジュールとの整合性を取る必要がある。",
      },
      {
        title: "移行期間中の紙と電子の混在管理が最大の懸念",
        content:
          "全面電子化までの移行期間中、紙のB/Lと電子B/Lが混在する状況が避けられない。二重チェック体制の構築は現場の負担を増やすため、十分な移行期間と段階的な導入が必要。",
      },
      {
        title: "不正輸入の検知体制の見直し",
        content:
          "現在の紙ベースの検査では、書類の物理的な特徴（透かし等）も不正検知の手がかりになっている。電子化に伴い、新たな不正検知の仕組みを構築する必要がある。",
      },
    ],
  },
  // パターン10: 荷主企業（大企業・賛成）
  {
    stance: "for",
    summary: "サプライチェーン全体の可視化・効率化に期待",
    role: "work_related",
    role_description:
      "製造業大手のSCM部門長\n年間数千TEUの海上輸送を管理\nDX推進担当",
    opinions: [
      {
        title: "サプライチェーンの可視化が大幅に向上する",
        content:
          "電子B/Lにより、貨物のステータスをリアルタイムで追跡できるようになる。これまで「B/Lがどこにあるか分からない」という状況が頻発していたが、電子化でサプライチェーン全体の可視性が飛躍的に向上する。",
      },
      {
        title: "在庫管理の最適化とキャッシュフロー改善",
        content:
          "B/Lの到着待ちによる貨物の滞留がなくなれば、ジャストインタイム配送が実現しやすくなる。在庫を最小限に抑えられ、運転資金の効率化にもつながる。当社の試算では年間1億円規模の改善効果が見込める。",
      },
      {
        title: "取引先との情報共有がスムーズになる",
        content:
          "現在は取引先ごとに異なるフォーマットで書類をやり取りしているが、電子B/Lの標準化により、取引先との情報共有がスムーズになる。EDI連携も容易になり、受発注から決済までのリードタイムが短縮される。",
      },
    ],
  },
];

/**
 * 船荷証券法案のインタビューセッションを作成（10パターン × 10ループ = 100件）
 */
export function createShippingBillSessions(
  configId: string
): Omit<InterviewSessionInsert, "id" | "created_at" | "updated_at">[] {
  const now = new Date();
  const sessions: Omit<
    InterviewSessionInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  for (let loop = 0; loop < 10; loop++) {
    const baseOffset = loop * 86400000 * 3;

    for (let p = 0; p < opinionPatterns.length; p++) {
      const userNum = loop * opinionPatterns.length + p + 200;
      sessions.push({
        interview_config_id: configId,
        user_id: `00000000-0000-0000-0000-${String(userNum).padStart(12, "0")}`,
        started_at: new Date(
          now.getTime() - baseOffset - (p + 1) * 3600000
        ).toISOString(),
        completed_at: new Date(
          now.getTime() - baseOffset - p * 3600000 - 1800000
        ).toISOString(),
      });
    }
  }

  return sessions;
}

/**
 * 船荷証券法案のインタビューメッセージを作成
 */
export function createShippingBillMessages(
  sessionIds: string[]
): Omit<InterviewMessageInsert, "id" | "created_at">[] {
  const messages: Omit<InterviewMessageInsert, "id" | "created_at">[] = [];

  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i];
    const pattern =
      opinionPatterns[i % opinionPatterns.length];

    messages.push({
      interview_session_id: sessionId,
      role: "assistant",
      content:
        "こんにちは！船荷証券の電子化に関する法律案についてお話を伺います。まず、この法案に賛成ですか？反対ですか？",
    });
    messages.push({
      interview_session_id: sessionId,
      role: "user",
      content:
        pattern.stance === "for"
          ? "賛成です。"
          : pattern.stance === "against"
            ? "反対です。"
            : pattern.stance === "conditional_for"
              ? "条件付きで賛成です。"
              : "判断が難しいです。",
    });
    messages.push({
      interview_session_id: sessionId,
      role: "assistant",
      content:
        "その理由と、あなたのお立場を教えてください。",
    });
    messages.push({
      interview_session_id: sessionId,
      role: "user",
      content: pattern.opinions
        .map((o) => `${o.title}：${o.content}`)
        .join("\n\n"),
    });
    messages.push({
      interview_session_id: sessionId,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    });
  }

  return messages;
}

/**
 * 船荷証券法案のインタビューレポートを作成（100件、各3 opinions）
 */
export function createShippingBillReports(
  sessionIds: string[]
): Omit<InterviewReportInsert, "id" | "created_at" | "updated_at">[] {
  return sessionIds.map((sessionId, index) => {
    const pattern =
      opinionPatterns[index % opinionPatterns.length];
    return {
      interview_session_id: sessionId,
      stance: pattern.stance,
      summary: pattern.summary,
      role: pattern.role,
      role_description: pattern.role_description,
      opinions: pattern.opinions,
      is_public_by_user: true,
    };
  });
}
