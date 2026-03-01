/**
 * LLM生成のdescription_md内の[ref:N]マーカーを検証・置換する純粋関数
 *
 * 1. references内の全session_idが既知セッションIDセットに含まれるか検証
 * 2. 無効な参照を除去
 * 3. description_md内の無効な[ref:N]マーカーを除去
 * 4. 有効な[ref:N]を「[インタビュー#N](/reports/SESSION_ID)」形式に変換
 */
export function validateAndReplaceReferences(
  descriptionMd: string,
  references: Array<{ ref_id: number; session_id: string }>,
  validSessionIds: Set<string>
): {
  cleanedMd: string;
  validReferences: Array<{ ref_id: number; session_id: string }>;
} {
  // 1. Filter references to only valid session IDs
  const validRefs = references.filter((ref) =>
    validSessionIds.has(ref.session_id)
  );
  const validRefIds = new Set(validRefs.map((ref) => ref.ref_id));

  // 2. Replace [ref:N] and [ref:N, ref:M, ...] markers in markdown
  const cleanedMd = descriptionMd.replace(
    /\[ref:\d+(?:,\s*ref:\d+)*\]/g,
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
          return `[インタビュー#${refId}](/reports/${ref.session_id})`;
        })
        .filter(Boolean);
      return replaced.join(", ");
    }
  );

  return { cleanedMd, validReferences: validRefs };
}
