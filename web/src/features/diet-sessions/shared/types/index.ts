export type DietSession = {
  id: string;
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
