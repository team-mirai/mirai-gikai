export type ReactionType = "helpful" | "hmm";

export type ReactionCounts = {
  helpful: number;
  hmm: number;
};

export type ReportReactionData = {
  counts: ReactionCounts;
  userReaction: ReactionType | null;
};
