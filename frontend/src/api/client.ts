const API_BASE_URL = "http://localhost:3000";

export type ApiErrorBody = {
  message?: string;
  errors?: string[];
  error?: string;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || body.error || `APIエラー: ${status}`);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<{ data: T; authorization: string | null }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const authorization = response.headers.get("Authorization");
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & ApiErrorBody) : ({} as T);

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody);
  }

  return { data: data as T, authorization };
}
