/**
 * 非公開 config を直接プレビューしたい時のみ interviewConfigId を受け付ける。
 * 認可: 同じ bill に紐づく有効なプレビュートークンが必須（無検証で受け取ると
 * 任意ユーザーが configId を知っているだけで非公開 config の prompt/model
 * を引き出せてしまうため）。
 */
export type ValidatePreviewTokenFn = (
  billId: string,
  token?: string
) => Promise<boolean>;

export type ResolvePreviewInterviewConfigIdResult =
  | { ok: true; interviewConfigId: string | undefined }
  | { ok: false; reason: "invalid_preview_token" };

export async function resolvePreviewInterviewConfigId(
  params: {
    billId: string;
    interviewConfigId?: string;
    previewToken?: string;
  },
  validatePreviewToken: ValidatePreviewTokenFn
): Promise<ResolvePreviewInterviewConfigIdResult> {
  const { billId, interviewConfigId, previewToken } = params;
  if (!interviewConfigId) {
    return { ok: true, interviewConfigId: undefined };
  }
  const isValidPreview = await validatePreviewToken(billId, previewToken);
  if (!isValidPreview) {
    return { ok: false, reason: "invalid_preview_token" };
  }
  return { ok: true, interviewConfigId };
}
