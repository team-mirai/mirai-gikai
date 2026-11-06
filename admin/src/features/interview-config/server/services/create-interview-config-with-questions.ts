import "server-only";

import {
  createInterviewConfigRecord,
  createInterviewQuestions,
  deleteInterviewConfigRecord,
} from "../repositories/interview-config-repository";

type ConfigRecord = Parameters<typeof createInterviewConfigRecord>[0];
type QuestionRows = Parameters<typeof createInterviewQuestions>[0];

/**
 * インタビュー設定と質問をまとめて作成する（複製・ファイル読み込みで使用）。
 * 質問の作成に失敗した場合は、作成した設定も削除する。
 */
export async function createInterviewConfigWithQuestions(
  record: ConfigRecord,
  buildQuestionRows: (configId: string) => QuestionRows
): Promise<{ id: string }> {
  const newConfig = await createInterviewConfigRecord(record);

  const questionRows = buildQuestionRows(newConfig.id);
  if (questionRows.length > 0) {
    try {
      await createInterviewQuestions(questionRows);
    } catch (error) {
      // 削除にも失敗した場合は記録だけして、元の質問作成エラーを返す
      await deleteInterviewConfigRecord(newConfig.id).catch((deleteError) => {
        console.error(
          "Failed to roll back interview config:",
          newConfig.id,
          deleteError
        );
      });
      throw error;
    }
  }

  return newConfig;
}
