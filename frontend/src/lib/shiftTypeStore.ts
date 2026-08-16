import { MAX_SHIFT_TYPES, type ShiftTypeMaster } from "../types/shift";

const STORAGE_KEY = "shift-maker.shift-types";

function isShiftType(value: unknown): value is ShiftTypeMaster {
  if (typeof value !== "object" || value == null) return false;
  const row = value as ShiftTypeMaster;
  return typeof row.id === "string" && typeof row.name === "string";
}

/** 保存済みのシフト種別マスタを読み込む */
export function loadShiftTypes(): ShiftTypeMaster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isShiftType).slice(0, MAX_SHIFT_TYPES);
  } catch {
    return [];
  }
}

/** シフト種別マスタを保存する */
export function saveShiftTypes(types: ShiftTypeMaster[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(types.slice(0, MAX_SHIFT_TYPES)),
  );
}
