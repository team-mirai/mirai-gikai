/** 議案・インタビュー設定の取得関数の組 */
export type InterviewChatLoaders<TConfig, TBill> = {
  getInterviewConfig: (billId: string) => Promise<TConfig>;
  getBill: (billId: string) => Promise<TBill>;
};

type ResolveInterviewChatLoadersParams<TConfig, TBill> = {
  billId: string;
  previewToken: string | undefined;
  validate: (billId: string, token: string) => Promise<boolean>;
  adminLoaders: InterviewChatLoaders<TConfig, TBill>;
  publicLoaders: InterviewChatLoaders<TConfig, TBill>;
};

/**
 * プレビュートークンの検証結果に応じて、使用するローダーの組を決定する。
 *
 * 管理者用ローダーは未公開議案や非公開インタビュー設定も読めるため、
 * 有効なプレビュートークンが提示された場合に限り選択する。
 * トークンが指定されていない場合は検証自体を行わない（公開経路の
 * TTFB に検証コストを乗せないため）。
 */
export async function resolveInterviewChatLoaders<TConfig, TBill>({
  billId,
  previewToken,
  validate,
  adminLoaders,
  publicLoaders,
}: ResolveInterviewChatLoadersParams<TConfig, TBill>): Promise<
  InterviewChatLoaders<TConfig, TBill>
> {
  const isPreviewAuthorized = previewToken
    ? await validate(billId, previewToken)
    : false;

  return isPreviewAuthorized ? adminLoaders : publicLoaders;
}
