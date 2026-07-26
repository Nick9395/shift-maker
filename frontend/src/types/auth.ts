export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type UserResponse = {
  user: AuthUser;
};

export type MessageResponse = {
  message: string;
  errors?: string[];
};
