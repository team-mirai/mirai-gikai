import type { ExpertReport } from "../types";

type SessionWithReport = {
  id: string;
  user_id: string;
  interview_report: {
    id: string;
    stance: string | null;
  } | null;
  interview_configs: {
    id: string;
    bill_id: string;
    bills: {
      id: string;
      name: string;
    } | null;
  };
};

export function buildReportsByUserId(
  sessions: SessionWithReport[]
): Map<string, ExpertReport[]> {
  const reportsByUserId = new Map<string, ExpertReport[]>();

  for (const session of sessions) {
    const report = session.interview_report;
    const bills = session.interview_configs.bills;
    if (!report || !bills) continue;

    const existing = reportsByUserId.get(session.user_id) ?? [];
    existing.push({
      sessionId: session.id,
      billId: bills.id,
      configId: session.interview_configs.id,
      billName: bills.name,
      stance: report.stance,
    });
    reportsByUserId.set(session.user_id, existing);
  }

  return reportsByUserId;
}
