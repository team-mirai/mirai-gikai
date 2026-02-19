export type Tag = {
  id: string;
  label: string;
  description: string | null;
  featured_priority: number | null;
  created_at: string;
  updated_at: string;
};

export type TagWithBillCount = Tag & {
  bill_count: number;
};

export type CreateTagInput = {
  label: string;
};

export type UpdateTagInput = {
  id: string;
  label: string;
  description?: string | null;
  featured_priority?: number | null;
};

export type DeleteTagInput = {
  id: string;
};
