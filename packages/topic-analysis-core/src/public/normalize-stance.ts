/** interview_report.stance（for/against）を 期待/懸念 に正規化（neutral 等は null）。 */
export function normalizeStanceToSentiment(
  stance: string | null
): "期待" | "懸念" | null {
  if (stance === "for") return "期待";
  if (stance === "against") return "懸念";
  return null;
}
