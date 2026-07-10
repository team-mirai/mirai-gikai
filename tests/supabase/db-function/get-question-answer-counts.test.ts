import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "../utils";

async function createTestInterviewConfig(
  billId: string,
  status: "public" | "closed" = "public"
) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: billId,
      status,
      name: `テスト設定 ${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

async function createTestQuestion(
  configId: string,
  question: string,
  questionOrder: number
) {
  const { data, error } = await adminClient
    .from("interview_questions")
    .insert({
      interview_config_id: configId,
      question,
      question_order: questionOrder,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_question 作成失敗: ${error.message}`);
  return data;
}

async function createTestSession(configId: string, userId: string) {
  const { data, error } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`interview_session 作成失敗: ${error.message}`);
  return data;
}

async function insertMessage(
  sessionId: string,
  role: "assistant" | "user",
  content: string,
  createdAt: string
) {
  const { error } = await adminClient.from("interview_messages").insert({
    interview_session_id: sessionId,
    role,
    content,
    created_at: createdAt,
  });
  if (error) throw new Error(`interview_messages 作成失敗: ${error.message}`);
}

function assistantContent(questionId: string) {
  return JSON.stringify({ text: "質問です", question_id: questionId });
}

const base = new Date("2026-06-01T00:00:00.000Z").getTime();
const iso = (offsetSec: number) =>
  new Date(base + offsetSec * 1000).toISOString();

describe("get_question_answer_counts() 関数", () => {
  let testUser: TestUser;
  const billIds: string[] = [];

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    await cleanupTestUser(testUser.id);
  });

  it("質問ごとの提示セッション数と回答セッション数を集計する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const q1 = await createTestQuestion(config.id, "質問1", 1);
    const q2 = await createTestQuestion(config.id, "質問2", 2);

    // セッション1: q1提示→回答あり、q2提示→回答なし（離脱）
    const s1 = await createTestSession(config.id, testUser.id);
    await insertMessage(s1.id, "assistant", assistantContent(q1.id), iso(0));
    await insertMessage(s1.id, "user", "回答1", iso(10));
    await insertMessage(s1.id, "assistant", assistantContent(q2.id), iso(20));

    // セッション2: q1提示→回答あり
    const s2 = await createTestSession(config.id, testUser.id);
    await insertMessage(s2.id, "assistant", assistantContent(q1.id), iso(0));
    await insertMessage(s2.id, "user", "回答2", iso(10));

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data?.[0]).toMatchObject({
      question_id: q1.id,
      question: "質問1",
      question_order: 1,
      asked_session_count: 2,
      answered_session_count: 2,
    });
    expect(data?.[1]).toMatchObject({
      question_id: q2.id,
      question: "質問2",
      question_order: 2,
      asked_session_count: 1,
      answered_session_count: 0,
    });
  });

  it("同一セッションで同じ質問が複数回提示されても1セッションと数える", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const q1 = await createTestQuestion(config.id, "質問1", 1);

    const s1 = await createTestSession(config.id, testUser.id);
    await insertMessage(s1.id, "assistant", assistantContent(q1.id), iso(0));
    await insertMessage(s1.id, "user", "回答", iso(10));
    await insertMessage(s1.id, "assistant", assistantContent(q1.id), iso(20));
    await insertMessage(s1.id, "user", "追加回答", iso(30));

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config.id }
    );

    expect(error).toBeNull();
    expect(data?.[0].asked_session_count).toBe(1);
    expect(data?.[0].answered_session_count).toBe(1);
  });

  it("legacyのcamelCaseキー（questionId）も集計する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const q1 = await createTestQuestion(config.id, "質問1", 1);

    const s1 = await createTestSession(config.id, testUser.id);
    await insertMessage(
      s1.id,
      "assistant",
      JSON.stringify({ text: "質問です", questionId: q1.id }),
      iso(0)
    );
    await insertMessage(s1.id, "user", "回答", iso(10));

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config.id }
    );

    expect(error).toBeNull();
    expect(data?.[0].asked_session_count).toBe(1);
    expect(data?.[0].answered_session_count).toBe(1);
  });

  it("JSONでないメッセージや不正なquestion_idはスキップする", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    const q1 = await createTestQuestion(config.id, "質問1", 1);

    const s1 = await createTestSession(config.id, testUser.id);
    // 非JSONのプレーンテキスト
    await insertMessage(s1.id, "assistant", "プレーンテキストの質問", iso(0));
    // JSONだがオブジェクトでない
    await insertMessage(s1.id, "assistant", '"文字列JSON"', iso(10));
    // question_idがUUIDでない
    await insertMessage(
      s1.id,
      "assistant",
      JSON.stringify({ text: "質問", question_id: "not-a-uuid" }),
      iso(20)
    );
    // question_idなし
    await insertMessage(
      s1.id,
      "assistant",
      JSON.stringify({ text: "質問のみ" }),
      iso(30)
    );
    await insertMessage(s1.id, "user", "回答", iso(40));

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].question_id).toBe(q1.id);
    expect(data?.[0].asked_session_count).toBe(0);
    expect(data?.[0].answered_session_count).toBe(0);
  });

  it("一度も提示されていない質問も0件で返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    await createTestQuestion(config.id, "質問1", 1);
    await createTestQuestion(config.id, "質問2", 2);

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data?.every((row) => row.asked_session_count === 0)).toBe(true);
  });

  it("別configのセッションは集計に含まれない", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config1 = await createTestInterviewConfig(bill.id);
    const config2 = await createTestInterviewConfig(bill.id, "closed");
    const q1 = await createTestQuestion(config1.id, "質問1", 1);

    // config2のセッションがconfig1の質問IDを参照しても数えない
    const s2 = await createTestSession(config2.id, testUser.id);
    await insertMessage(s2.id, "assistant", assistantContent(q1.id), iso(0));
    await insertMessage(s2.id, "user", "回答", iso(10));

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config1.id }
    );

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].asked_session_count).toBe(0);
  });

  it("question_orderの昇順で返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);
    await createTestQuestion(config.id, "質問B", 2);
    await createTestQuestion(config.id, "質問A", 1);
    await createTestQuestion(config.id, "質問C", 3);

    const { data, error } = await adminClient.rpc(
      "get_question_answer_counts",
      { p_config_id: config.id }
    );

    expect(error).toBeNull();
    expect(data?.map((row) => row.question)).toEqual([
      "質問A",
      "質問B",
      "質問C",
    ]);
  });
});
