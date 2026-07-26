import { apiRequest } from "./client";
import type { MessageResponse, UserResponse } from "../types/auth";

export async function signup(params: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}): Promise<{ user: UserResponse["user"]; token: string }> {
  const { data, authorization } = await apiRequest<UserResponse>(
    "/api/v1/signup",
    {
      method: "POST",
      body: {
        user: {
          name: params.name,
          email: params.email,
          password: params.password,
          password_confirmation: params.passwordConfirmation,
        },
      },
    },
  );

  if (!authorization) {
    throw new Error("認証トークンを取得できませんでした");
  }

  return { user: data.user, token: authorization };
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<{ user: UserResponse["user"]; token: string }> {
  const { data, authorization } = await apiRequest<UserResponse>(
    "/api/v1/login",
    {
      method: "POST",
      body: {
        user: {
          email: params.email,
          password: params.password,
        },
      },
    },
  );

  if (!authorization) {
    throw new Error("認証トークンを取得できませんでした");
  }

  return { user: data.user, token: authorization };
}

export async function logout(token: string): Promise<void> {
  await apiRequest<MessageResponse>("/api/v1/logout", {
    method: "DELETE",
    token,
  });
}

export async function fetchMe(token: string): Promise<UserResponse> {
  const { data } = await apiRequest<UserResponse>("/api/v1/me", { token });
  return data;
}

export async function requestPasswordReset(email: string): Promise<MessageResponse> {
  const { data } = await apiRequest<MessageResponse>("/api/v1/password", {
    method: "POST",
    body: { user: { email } },
  });
  return data;
}

export async function resetPassword(params: {
  resetPasswordToken: string;
  password: string;
  passwordConfirmation: string;
}): Promise<MessageResponse> {
  const { data } = await apiRequest<MessageResponse>("/api/v1/password", {
    method: "PUT",
    body: {
      user: {
        reset_password_token: params.resetPasswordToken,
        password: params.password,
        password_confirmation: params.passwordConfirmation,
      },
    },
  });
  return data;
}
