import { sheetCellKey } from "../types/shift";
import type {
  ShiftCountDraft,
  ShiftStaffDraft,
  ShiftTypeCategory,
  ShiftTypeMaster,
} from "../types/shift";
import { WORKING_SHIFT_CATEGORIES } from "./dutyCounts";

function parseRequired(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

/** 行に選ばれている種別ID（空と重複を除く） */
export function selectedShiftTypeIds(row: ShiftCountDraft): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of row.shiftTypeIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/** 種別が1つ以上ある行だけをカウント対象にする */
export function activeShiftCounts(rows: ShiftCountDraft[]): ShiftCountDraft[] {
  return rows.filter((row) => selectedShiftTypeIds(row).length > 0);
}

/** 早朝〜夜間の勤務種別だけを候補にする */
export function workingShiftTypes(
  types: readonly ShiftTypeMaster[],
): ShiftTypeMaster[] {
  return types.filter(
    (type) =>
      type.name.trim() !== "" &&
      WORKING_SHIFT_CATEGORIES.has(type.category as ShiftTypeCategory),
  );
}

/** 1日分のシフトカウント。行ID → 人数 */
export function countShiftTypesForDate(params: {
  staff: ShiftStaffDraft[];
  shiftCounts: ShiftCountDraft[];
  cells: Record<string, string>;
  isoDate: string;
}): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of params.shiftCounts) {
    totals.set(row.id, 0);
  }

  const settings = activeShiftCounts(params.shiftCounts);
  if (settings.length === 0) return totals;

  const typeToRowId = new Map<string, string>();
  for (const row of settings) {
    for (const typeId of selectedShiftTypeIds(row)) {
      if (typeToRowId.has(typeId)) continue;
      typeToRowId.set(typeId, row.id);
    }
  }

  for (const member of params.staff) {
    const typeId = params.cells[sheetCellKey(member.id, params.isoDate)];
    if (!typeId) continue;
    const rowId = typeToRowId.get(typeId);
    if (!rowId) continue;
    totals.set(rowId, (totals.get(rowId) ?? 0) + 1);
  }

  return totals;
}

/** 不足通知ONかつ実数が必要人数未満なら true */
export function isShiftCountShort(
  row: ShiftCountDraft,
  actual: number,
): boolean {
  if (!row.shortageNotice) return false;
  const required = parseRequired(row.requiredCount);
  if (required == null) return false;
  return actual < required;
}
