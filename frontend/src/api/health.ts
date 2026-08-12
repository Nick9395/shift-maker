import type { HealthResponse } from "../types/health";

import { API_BASE_URL } from "../config";

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);

  if (!response.ok) {
    throw new Error(`APIエラー: ${response.status}`);
  }

  return response.json();
};