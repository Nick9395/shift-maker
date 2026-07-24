export type AuthUser = {
  id: number;
  email: string;
};

export type UserResponse = {
  user: AuthUser;
};

export type MessageResponse = {
  message: string;
  errors?: string[];
};
