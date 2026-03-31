/**
 * LLM生成のdescription_md内の[ref:N]マーカーを検証・置換する純粋関数
 *
 * 1. references内の全session_idが既知セッションIDセットに含まれるか検証
 * 2. 無効な参照を除去
 * 3. description_md内の無効な[ref:N]マーカーを除去
 * 4. 有効な[ref:N]を脚注リンク形式に変換
 *    - 単独ref: `[[1]](url)`
 *    - 複数ref（カンマ区切りまたは連続）: `[[1]](url)[[4]](url)`
 */
export function validateAndReplaceReferences(
  descriptionMd: string,
  references: Array<{ ref_id: number; session_id: string }>,
  validSessionIds: Set<string>,
  billId: string,
  sessionConfigMap: Record<string, string>
): {
  cleanedMd: string;
  validReferences: Array<{ ref_id: number; session_id: string }>;
} {
  // 1. Filter references to only valid session IDs with resolvable configId
  const validRefs = references.filter(
    (ref) =>
      validSessionIds.has(ref.session_id) && sessionConfigMap[ref.session_id]
  );

  // 2. Replace ref markers in markdown
  // Match: [ref:N], [ref:N, ref:M, ...], and consecutive [ref:N][ref:M]...
  const cleanedMd = descriptionMd.replace(
    /\[ref:\d+(?:,\s*ref:\d+)*\](?:\[ref:\d+(?:,\s*ref:\d+)*\])*/g,
    (match) => {
      const refIds = [...match.matchAll(/ref:(\d+)/g)].map((m) =>
        Number.parseInt(m[1], 10)
      );
      const replaced = refIds
        .map((refId) => {
          const ref = validRefs.find((r) => r.ref_id === refId);
          if (!ref) {
            return null;
          }
          const configId = sessionConfigMap[ref.session_id];
          return `[[${refId}]](/bills/${billId}/interview/${configId}/reports/${ref.session_id})`;
        })
        .filter(Boolean);
      if (replaced.length === 0) {
        return "";
      }
      return replaced.join("");
    }
  );

  return { cleanedMd, validReferences: validRefs };
}
