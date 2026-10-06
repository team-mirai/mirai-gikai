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

/** slug が設定済みの会期。会期ページへリンクする一覧で使う。 */
export type SluggedDietSession = DietSession & { slug: string };
