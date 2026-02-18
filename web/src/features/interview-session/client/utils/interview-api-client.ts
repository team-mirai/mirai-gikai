interface CompleteInterviewParams {
  sessionId: string;
}

interface CompleteInterviewResult {
  report?: {
    id: string;
  };
}

/**
 * インタビュー完了APIを呼び出して、レポートをDBに保存
 */
export async function callCompleteApi(
  params: CompleteInterviewParams
): Promise<CompleteInterviewResult> {
  const res = await fetch("/api/interview/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to complete interview");
  }

  return (await res.json()) as CompleteInterviewResult;
}
