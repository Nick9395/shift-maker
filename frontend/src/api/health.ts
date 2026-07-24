import type { HealthResponse } from "../types/health";

const API_BASE_URL = "http://localhost:3000";

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);

  if (!response.ok) {
    throw new Error(`APIエラー: ${response.status}`);
  }

  return response.json();
};