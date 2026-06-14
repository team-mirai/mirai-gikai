import type { BillUpdateRow } from "./bill-update-csv";

const OVERVIEW_URL =
  "https://www.city.kusatsu.shiga.jp/shisei/gyoseijoho/" +
  "shityougiangiin/shityouteisyutsugian.files/" +
  "20260226giangaiyousho.pdf";
const BUDGET_URL =
  "https://www.city.kusatsu.shiga.jp/shisei/gyoseijoho/" +
  "shityougiangiin/shityouteisyutsugian.files/R8.2yosan.pdf";

interface OfficialBillData {
  number: number;
  summary: string;
  details: string[];
  sourceUrl?: string;
  result?: string;
  featured?: boolean;
}

export const R8_FEB_BILLS: OfficialBillData[] = [
  {
    number: 2,
    summary:
      "衆議院議員総選挙と最高裁判所裁判官国民審査の執行費6,311万1千円を追加した補正予算の専決処分を承認する議案です。",
    details: [
      "令和7年度草津市一般会計補正予算（第7号）",
      "補正額は6,311万1千円",
      "2026年1月23日に専決処分",
    ],
    result: "承認",
  },
  {
    number: 3,
    summary:
      "令和8年度の草津市一般会計として695億2,000万円を定める予算案です。",
    details: [
      "歳入歳出予算の総額は695億2,000万円",
      "民生費は約317億5,461万円",
      "教育費は約77億1,715万円",
    ],
    sourceUrl: BUDGET_URL,
    featured: true,
  },
  {
    number: 4,
    summary:
      "令和8年度の国民健康保険事業特別会計として111億750万円を定める予算案です。",
    details: ["国民健康保険事業の保険給付や運営に必要な予算です。"],
    sourceUrl: BUDGET_URL,
  },
  {
    number: 5,
    summary:
      "令和8年度の財産区特別会計として1億1,040万円を定める予算案です。",
    details: ["財産区が所有する財産の管理などに必要な予算です。"],
    sourceUrl: BUDGET_URL,
  },
  {
    number: 6,
    summary:
      "令和8年度の介護保険事業特別会計として109億7,620万円を定める予算案です。",
    details: ["介護保険給付や地域支援事業などに必要な予算です。"],
    sourceUrl: BUDGET_URL,
  },
  {
    number: 7,
    summary:
      "令和8年度の後期高齢者医療特別会計として24億3,960万円を定める予算案です。",
    details: ["後期高齢者医療制度の運営に必要な予算です。"],
    sourceUrl: BUDGET_URL,
  },
  {
    number: 8,
    summary:
      "令和8年度の水道事業会計として49億9,700万円を定める予算案です。",
    details: ["安全な水道水の供給と水道施設の維持管理に関する予算です。"],
    sourceUrl: BUDGET_URL,
  },
  {
    number: 9,
    summary:
      "令和8年度の下水道事業会計として59億6,900万円を定める予算案です。",
    details: ["下水道施設の整備、維持管理などに関する予算です。"],
    sourceUrl: BUDGET_URL,
  },
  {
    number: 10,
    summary:
      "行政手続法の改正に合わせ、不利益処分の通知に関する公示送達の方法を改める条例案です。",
    details: ["施行日は2026年5月21日です。"],
  },
  {
    number: 11,
    summary:
      "審議会の答申を受け、草津市議会議員の報酬額を2.83%引き上げる条例案です。",
    details: ["施行日は2026年4月1日です。"],
  },
  {
    number: 12,
    summary:
      "審議会の答申を受け、市長、副市長、教育長など特別職の報酬・給与額を2.83%引き上げる条例案です。",
    details: ["施行日は2026年4月1日です。"],
  },
  {
    number: 13,
    summary:
      "人材獲得競争への対応として第二種初任給調整手当を新設するなど、市職員の給与制度を改める条例案です。",
    details: [
      "最低賃金相当額を下回る場合の差額を補う手当を新設します。",
      "施行日は2026年4月1日です。",
    ],
  },
  {
    number: 14,
    summary:
      "産後ケアの宿泊サービスなど、市が徴収する一部手数料を見直す条例案です。",
    details: [
      "産後ケア宿泊サービスを6,600円から1万円へ改定します。",
      "2027年3月31日までは経過措置として8,300円です。",
      "高齢者短期宿泊事業の利用者負担も見直します。",
    ],
    featured: true,
  },
  {
    number: 15,
    summary:
      "小学校給食の無償化に伴い、学校給食センター特別会計を廃止する条例案です。",
    details: ["施行日は2026年4月1日です。"],
    featured: true,
  },
  {
    number: 16,
    summary:
      "災害関連死などの判断が難しい場合に調査審議する、災害弔慰金等認定審査会を設置する条例案です。",
    details: ["施行日は2026年4月1日です。"],
  },
  {
    number: 17,
    summary:
      "こども誰でも通園制度を運営する事業者が守る基準を定める、新しい条例案です。",
    details: [
      "子どもの意思と人格の尊重、虐待防止、関係機関との連携などを定めます。",
      "施行日は2026年4月1日です。",
    ],
    featured: true,
  },
  {
    number: 18,
    summary:
      "こども誰でも通園制度の利用料を保護者から徴収するため、対象や減免、納付方法を定める条例案です。",
    details: ["施行日は2026年4月1日です。"],
    featured: true,
  },
  {
    number: 19,
    summary:
      "給与所得控除の改正に伴う介護保険料の特例減免について、対象者の申請を不要とする条例案です。",
    details: ["施行日は2026年4月1日です。"],
  },
  {
    number: 20,
    summary:
      "国の道路占用料改定に合わせ、市道や駅前広場の占用料を見直す条例案です。",
    details: ["施行日は2026年4月1日です。"],
  },
  {
    number: 21,
    summary:
      "矢倉町内会へ引き渡した土地から地中埋設物が見つかったため、処理費299万2千円を賠償する議案です。",
    details: ["損害賠償額は299万2千円です。"],
  },
  {
    number: 22,
    summary: "市道として6路線、合計768.9メートルを新たに認定する議案です。",
    details: ["認定する路線は6路線です。"],
  },
  {
    number: 23,
    summary: "市道1路線、521.3メートルを廃止する議案です。",
    details: ["廃止する路線は1路線です。"],
  },
];

function getBillNumber(name: string) {
  const match = name.match(/^議第(\d+)号/);
  if (!match) {
    throw new Error(`議案番号を取得できません: ${name}`);
  }
  return Number(match[1]);
}

function buildContent(
  title: string,
  summary: string,
  details: string[],
  result: string,
  sourceUrl: string,
  detailed: boolean
) {
  const points = details.map((detail) => `- ${detail}`).join("\n");
  const heading = detailed ? "議案の内容" : "この議案のポイント";
  return `# ${title}

## ${heading}

${summary}

${points}

## 議決結果

${result}（2026年3月26日）

## 出典

[草津市公式資料](${sourceUrl})

> このページは草津市の公式資料を基に作成した要約です。正確な内容は出典資料をご確認ください。`;
}

export function applyR8FebOfficialData(row: BillUpdateRow): BillUpdateRow {
  const number = getBillNumber(row.name);
  const data = R8_FEB_BILLS.find((bill) => bill.number === number);
  if (!data) {
    throw new Error(`公式データがありません: 議第${number}号`);
  }

  const sourceUrl = data.sourceUrl ?? OVERVIEW_URL;
  const result = data.result ?? "原案可決";
  const normalTitle = row.name.replace(/案$/, "");

  return {
    ...row,
    status: "enacted",
    statusNote: `${result}（2026年3月26日）`,
    publishStatus: "published",
    isFeatured: data.featured ?? false,
    slug: `r8-2-gidai-${number}`,
    sourceUrl,
    normalTitle,
    normalSummary: data.summary,
    normalContent: buildContent(
      normalTitle,
      data.summary,
      data.details,
      result,
      sourceUrl,
      false
    ),
    hardTitle: row.name,
    hardSummary: data.summary,
    hardContent: buildContent(
      row.name,
      data.summary,
      data.details,
      result,
      sourceUrl,
      true
    ),
  };
}
