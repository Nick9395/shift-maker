import { fetchShifts } from "../api/shifts";
import { MAX_SHIFTS } from "../types/shift";

export const SHIFT_CREATE_LIMIT_MESSAGE = `シフト表の作成上限は${MAX_SHIFTS}件です`;

/** 保存済みシフト表が上限に達しているか */
export async function isAtShiftCreateLimit(token: string): Promise<boolean> {
  const rows = await fetchShifts(token);
  return rows.length >= MAX_SHIFTS;
}
