import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestBillContent,
  createTestUser,
  type TestUser,
} from "@test-utils/utils";

export type PublicReportLoaderContext = {
  user: TestUser;
  billId: string;
  configId: string;
};

type TestMessage = {
  role: "user" | "assistant";
  content: string;
};

type CreatePublicReportOptions = {
  isPublicByAdmin?: boolean;
  isPublicByUser?: boolean;
  stance?: "for" | "against" | "neutral" | null;
  summary?: string;
  roleTitle?: string;
  contentRichnessTotal?: number;
  messages?: TestMessage[];
};

export async function createPublicReportLoaderContext(
  billContentTitle = "議案タイトル"
): Promise<PublicReportLoaderContext> {
  const user = await createTestUser();
  const bill = await createTestBill();

  try {
    await createTestBillContent(bill.id, { title: billContentTitle });

    const { data: config, error } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: bill.id,
        status: "public",
        name: `公開レポート loader テスト ${Date.now()}`,
      })
      .select()
      .single();
    if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);

    return { user, billId: bill.id, configId: config.id };
  } catch (error) {
    const cleanupResults = await Promise.allSettled([
      cleanupTestBill(bill.id),
      cleanupTestUser(user.id),
    ]);
    const rejected = cleanupResults.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );
    if (rejected.length > 0) {
      console.error(
        `テストデータのクリーンアップに失敗しました: ${rejected
          .map((result) => String(result.reason))
          .join(", ")}`
      );
    }
    throw error;
  }
}

export async function cleanupPublicReportLoaderContext(
  context: PublicReportLoaderContext | null
) {
  if (!context) return;

  const billCleanupResults = await Promise.allSettled([
    cleanupTestBill(context.billId),
  ]);
  const userCleanupResults = await Promise.allSettled([
    cleanupTestUser(context.user.id),
  ]);
  const rejected = [...billCleanupResults, ...userCleanupResults].filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );
  if (rejected.length > 0) {
    throw new Error(
      `テストデータのクリーンアップに失敗しました: ${rejected
        .map((result) => String(result.reason))
        .join(", ")}`
    );
  }
}

export async function createPublicReports(
  context: PublicReportLoaderContext,
  count: number,
  options: CreatePublicReportOptions = {}
) {
  if (count === 0) return [];

  const now = Date.now();
  const { data: sessions, error: sessionError } = await adminClient
    .from("interview_sessions")
    .insert(
      Array.from({ length: count }, (_, index) => ({
        interview_config_id: context.configId,
        user_id: context.user.id,
        started_at: new Date(now + index).toISOString(),
        completed_at: new Date(now + index + 1000).toISOString(),
      }))
    )
    .select();
  if (sessionError) {
    throw new Error(`interview_session 作成失敗: ${sessionError.message}`);
  }

  const { data: reports, error: reportError } = await adminClient
    .from("interview_report")
    .insert(
      sessions.map((session, index) => ({
        interview_session_id: session.id,
        is_public_by_admin: options.isPublicByAdmin ?? true,
        is_public_by_user: options.isPublicByUser ?? true,
        stance: options.stance === undefined ? "for" : options.stance,
        role: "general_citizen" as const,
        role_title: options.roleTitle ?? "会社員",
        summary: options.summary
          ? `${options.summary}-${index + 1}`
          : `公開レポート ${index + 1}`,
        content_richness: {
          total: options.contentRichnessTotal ?? 70,
          clarity: 70,
          specificity: 70,
          impact: 70,
          constructiveness: 70,
          reasoning: "テスト用の十分な内容",
        },
      }))
    )
    .select();
  if (reportError) {
    throw new Error(`interview_report 作成失敗: ${reportError.message}`);
  }

  if (options.messages) {
    const messages = options.messages;
    const { error: messageError } = await adminClient
      .from("interview_messages")
      .insert(
        sessions.flatMap((session) =>
          messages.map((message) => ({
            interview_session_id: session.id,
            role: message.role,
            content: message.content,
          }))
        )
      );
    if (messageError) {
      throw new Error(`interview_messages 作成失敗: ${messageError.message}`);
    }
  }

  return reports.map((report, index) => ({
    report,
    session: sessions[index],
  }));
}

export async function createPublicReport(
  context: PublicReportLoaderContext,
  options: CreatePublicReportOptions = {}
) {
  const [fixture] = await createPublicReports(context, 1, options);
  if (!fixture) throw new Error("公開レポート作成に失敗しました");
  return fixture;
}
