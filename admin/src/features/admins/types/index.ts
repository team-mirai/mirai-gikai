export type Admin = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export type InviteAdminInput = {
  email: string;
};

export type DeleteAdminInput = {
  id: string;
};
