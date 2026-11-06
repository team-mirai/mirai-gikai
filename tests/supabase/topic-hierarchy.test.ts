import { getPublicTopicAnalysis } from "@mirai-gikai/topic-analysis-core/public-server";
import {
  createVersion,
  finalizeVersion,
  getLeafTopicsWithOpinions,
  publishVersion,
  saveTopicsAndAssignments,
} from "@mirai-gikai/topic-analysis-core/repository";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "./utils";

/**
 * トピック2階層の統合テスト。
 *
 * DB 側の挙動に依存する部分を確かめる。
 * - 親を先に insert して子に parent_topic_id が載るか
 * - 複合FKで別 version のトピックを親にできないか
 * - 葉だけを返す経路が大トピックを除くか
 * - 公開ページのトピック並び順が従来（件数降順）のままか
 */

async function createOpinion(opts: {
  configId: string;
  userId: string;
  title: string;
}) {
  const { data: session, error: sErr } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: opts.configId,
      user_id: opts.userId,
      started_at: "2024-08-01T00:00:00Z",
      completed_at: "2024-08-01T00:00:00Z",
    })
    .select()
    .single();
  if (!session) throw new Error(`session 作成失敗: ${sErr?.message}`);

  const { data: report, error: rErr } = await adminClient
    .from("interview_report")
    .insert({
      interview_session_id: session.id,
      is_public_by_admin: true,
      is_public_by_user: true,
      // moderation_status は moderation_score からの生成列（<30 で ok）。
      moderation_score: 5,
      summary: "サマリ",
      stance: "for",
      role: "work_related",
      role_title: "肩書",
      opinions: [] as never,
      created_at: "2024-08-01T00:00:00Z",
    })
    .select()
    .single();
  if (!report) throw new Error(`report 作成失敗: ${rErr?.message}`);

  const { data: opinion, error: oErr } = await adminClient
    .from("interview_opinion")
    .insert({
      interview_report_id: report.id,
      opinion_index: 0,
      title: opts.title,
      content: `${opts.title} の内容`,
      contextual_quote: `${opts.title} の引用`,
      bill_sentiment: "懸念",
    })
    .select()
    .single();
  if (!opinion) throw new Error(`opinion 作成失敗: ${oErr?.message}`);
  return opinion;
}

describe("トピック2階層 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;
    const { data: config, error } = await adminClient
      .from("interview_configs")
      .insert({ bill_id: billId, status: "public", name: "hierarchy-test" })
      .select()
      .single();
    if (!config) throw new Error(`config 作成失敗: ${error?.message}`);
    configId = config.id;
  });

  afterAll(async () => {
    // 片方が失敗しても残りの後始末を進める。
    await Promise.allSettled([
      cleanupTestBill(billId),
      cleanupTestUser(testUser.id),
    ]);
  });

  it("親を先に入れて子に parent_topic_id が載る", async () => {
    const version = await createVersion(billId, "manual", "test", "v4");
    if (!version) throw new Error("version 作成失敗");
    const opinion = await createOpinion({
      configId,
      userId: testUser.id,
      title: "階層テスト用",
    });

    await saveTopicsAndAssignments(
      version.id,
      [
        {
          title: "大トピック",
          description: "領域の見出し",
          sort_order: 0,
          parent_sort_order: null,
        },
        {
          title: "中トピックの主張",
          description: "主張の説明",
          sort_order: 1,
          parent_sort_order: 0,
        },
      ],
      [{ opinion_id: opinion.id, topic_index: 1 }]
    );

    const { data: topics } = await adminClient
      .from("topic")
      .select("id, title, sort_order, parent_topic_id")
      .eq("version_id", version.id)
      .order("sort_order");

    expect(topics?.map((t) => t.title)).toEqual([
      "大トピック",
      "中トピックの主張",
    ]);
    expect(topics?.[0].parent_topic_id).toBeNull();
    expect(topics?.[1].parent_topic_id).toBe(topics?.[0].id);

    // 意見は葉にだけ紐づく
    const { data: links } = await adminClient
      .from("topic_opinion")
      .select("topic_id")
      .eq("version_id", version.id);
    expect(links).toHaveLength(1);
    expect(links?.[0].topic_id).toBe(topics?.[1].id);

    // 葉だけを返す経路は大トピックを除く
    const leaves = await getLeafTopicsWithOpinions(version.id);
    expect(leaves.map((t) => t.title)).toEqual(["中トピックの主張"]);

    // pending のまま残すと one_active_version_per_bill で次の版が作れない
    await finalizeVersion(version.id, 1);
  });

  // topic_opinion と同じく、別 version のトピックを親にできないよう複合FKで縛っている。
  it("別 version のトピックを親にできない", async () => {
    const parentVersion = await createVersion(billId, "manual", "test", "v4");
    if (!parentVersion) throw new Error("version 作成失敗");
    await finalizeVersion(parentVersion.id, 0);
    const other = await createVersion(billId, "manual", "test", "v4");
    if (!other) throw new Error("version 作成失敗");
    const { data: foreignParent } = await adminClient
      .from("topic")
      .insert({
        version_id: parentVersion.id,
        title: "別versionの親",
        description: "-",
        sort_order: 0,
      })
      .select()
      .single();
    if (!foreignParent) throw new Error("topic 作成失敗");

    const { error } = await adminClient.from("topic").insert({
      version_id: other.id,
      title: "別versionを親にする子",
      description: "-",
      sort_order: 99,
      parent_topic_id: foreignParent.id,
    });

    expect(error).not.toBeNull();
    await finalizeVersion(other.id, 0);
  });

  // 子を全部削除された大トピックは「子なし」になるが、意見0件なので葉に昇格しない。
  // 子の有無で判定していると、領域見出しが増分の割当先候補として復活する。
  it("子を失った大トピックは葉として返らない", async () => {
    const version = await createVersion(billId, "manual", "test", "v4");
    if (!version) throw new Error("version 作成失敗");
    const opinion = await createOpinion({
      configId,
      userId: testUser.id,
      title: "孤児親テスト",
    });

    await saveTopicsAndAssignments(
      version.id,
      [
        {
          title: "大",
          description: "-",
          sort_order: 0,
          parent_sort_order: null,
        },
        { title: "中", description: "-", sort_order: 1, parent_sort_order: 0 },
      ],
      [{ opinion_id: opinion.id, topic_index: 1 }]
    );

    // 唯一の子を削除して親を子なしにする
    const { data: child } = await adminClient
      .from("topic")
      .select("id")
      .eq("version_id", version.id)
      .eq("sort_order", 1)
      .single();
    if (!child) throw new Error("子トピックが無い");
    await adminClient.from("topic").delete().eq("id", child.id);

    const leaves = await getLeafTopicsWithOpinions(version.id);
    expect(leaves).toEqual([]);

    await finalizeVersion(version.id, 1);
  });

  // 2階層化以前の version は親も子も持たない。意見が付いた行が葉。
  it("旧データ（フラット）は全件が葉として返る", async () => {
    const version = await createVersion(billId, "manual", "test", "v4");
    if (!version) throw new Error("version 作成失敗");
    const o1 = await createOpinion({
      configId,
      userId: testUser.id,
      title: "旧データ1",
    });
    const o2 = await createOpinion({
      configId,
      userId: testUser.id,
      title: "旧データ2",
    });
    // 親を持たないフラットなトピック（2階層化以前と同じ形）
    await saveTopicsAndAssignments(
      version.id,
      [
        {
          title: "旧A",
          description: "-",
          sort_order: 0,
          parent_sort_order: null,
        },
        {
          title: "旧B",
          description: "-",
          sort_order: 1,
          parent_sort_order: null,
        },
      ],
      [
        { opinion_id: o1.id, topic_index: 0 },
        { opinion_id: o2.id, topic_index: 1 },
      ]
    );

    const leaves = await getLeafTopicsWithOpinions(version.id);
    expect(leaves.map((t) => t.title)).toEqual(["旧A", "旧B"]);
    await finalizeVersion(version.id, 2);
  });

  // 2階層化で sort_order の意味が「件数降順」から「深さ優先」に変わったため、
  // 公開側で並べ直さないと web のトピック順が黙って変わる。
  it("公開ページのトピック順は件数降順のまま（階層の深さ優先順にしない）", async () => {
    const version = await createVersion(billId, "manual", "test", "v4");
    if (!version) throw new Error("version 作成失敗");

    // 大A(合計3: 2件/1件) → 大B(合計4: 4件) の順で並べる。
    // 深さ優先のままだと 2,1,4 になる。件数降順なら 4,2,1。
    const counts = { few: 1, mid: 2, many: 4 };
    const opinionsBySlot: Record<string, string[]> = {
      few: [],
      mid: [],
      many: [],
    };
    for (const [slot, n] of Object.entries(counts)) {
      for (let i = 0; i < n; i++) {
        const o = await createOpinion({
          configId,
          userId: testUser.id,
          title: `${slot}-${i}`,
        });
        opinionsBySlot[slot].push(o.id);
      }
    }

    await saveTopicsAndAssignments(
      version.id,
      [
        {
          title: "大A",
          description: "-",
          sort_order: 0,
          parent_sort_order: null,
        },
        {
          title: "中mid",
          description: "-",
          sort_order: 1,
          parent_sort_order: 0,
        },
        {
          title: "中few",
          description: "-",
          sort_order: 2,
          parent_sort_order: 0,
        },
        {
          title: "大B",
          description: "-",
          sort_order: 3,
          parent_sort_order: null,
        },
        {
          title: "中many",
          description: "-",
          sort_order: 4,
          parent_sort_order: 3,
        },
      ],
      [
        ...opinionsBySlot.mid.map((id) => ({ opinion_id: id, topic_index: 1 })),
        ...opinionsBySlot.few.map((id) => ({ opinion_id: id, topic_index: 2 })),
        ...opinionsBySlot.many.map((id) => ({
          opinion_id: id,
          topic_index: 4,
        })),
      ]
    );
    await finalizeVersion(version.id, 7);
    await publishVersion(version.id);

    const published = await getPublicTopicAnalysis(billId);

    // 大トピックは意見0件なので出ない。中トピックは件数降順。
    expect(published?.topics.map((t) => t.title)).toEqual([
      "中many",
      "中mid",
      "中few",
    ]);
    expect(published?.topics.map((t) => t.opinion_count)).toEqual([4, 2, 1]);
  });
});
