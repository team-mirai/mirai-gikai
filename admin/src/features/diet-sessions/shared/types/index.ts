export type { DietSession } from "@mirai-gikai/shared/diet-sessions/types";

export type CreateDietSessionInput = {
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
};

export type UpdateDietSessionInput = {
  id: string;
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
};

export type DeleteDietSessionInput = {
  id: string;
};
