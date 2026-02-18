export type Admin = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export type CreateAdminInput = {
  email: string;
  password: string;
};

export type DeleteAdminInput = {
  id: string;
};
