export type ExpertReport = {
  sessionId: string;
  billId: string;
  billName: string;
  stance: string | null;
};

export type Expert = {
  id: string;
  name: string;
  email: string;
  affiliation: string;
  created_at: string;
  reports: ExpertReport[];
};
