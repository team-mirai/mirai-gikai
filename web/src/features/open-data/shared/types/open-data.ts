import type { OpenDataOpinion } from "../utils/opinions";

export type OpenDataMessage = {
  role: "assistant" | "user";
  content: string;
};

export type OpenDataInterviewItem = {
  reportId: string;
  billId: string;
  billName: string;
  stance: string | null;
  role: string | null;
  roleTitle: string | null;
  roleDescription: string | null;
  summary: string | null;
  opinions: OpenDataOpinion[];
  messages: OpenDataMessage[];
  createdAt: string;
};

export type OpenDataInterviewsResult = {
  items: OpenDataInterviewItem[];
  nextCursor: string | null;
};
