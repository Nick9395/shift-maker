import { sheetCellKey } from "../types/shift";
import type {
  ShiftStaffDraft,
  ShiftTypeCategory,
  ShiftTypeMaster,
} from "../types/shift";
import { WORKING_SHIFT_CATEGORIES } from "./dutyCounts";

export const SUMMARY_COLUMNS = [
  "出勤",
  "出張",
  "公休",
  "年休",
  "時間休",
  "特休",
] as const;

export type SummaryColumn = (typeof SUMMARY_COLUMNS)[number];

const CATEGORY_TO_SUMMARY: Partial<Record<string, SummaryColumn>> = {
  出張: "出張",
  公休: "公休",
  年休: "年休",
  時間休: "時間休",
  特休: "特休",
};

function emptySummary(): Record<SummaryColumn, number> {
  return {
    出勤: 0,
    出張: 0,
    公休: 0,
    年休: 0,
    時間休: 0,
    特休: 0,
  };
}

/** 種別カテゴリが属するサマリー列。出勤は早朝〜夜間のみ */
export function summaryColumnForCategory(
  category: string,
): SummaryColumn | null {
  if (WORKING_SHIFT_CATEGORIES.has(category as ShiftTypeCategory)) {
    return "出勤";
  }
  return CATEGORY_TO_SUMMARY[category] ?? null;
}

/** 1職員の期間内サマリー（空マスはどの列にも入れない） */
export function countStaffSummary(
  staff: ShiftStaffDraft,
  dates: readonly string[],
  cells: Record<string, string>,
  types: readonly ShiftTypeMaster[],
): Record<SummaryColumn, number> {
  const totals = emptySummary();
  const typeById = new Map(types.map((type) => [type.id, type]));

  for (const iso of dates) {
    const typeId = cells[sheetCellKey(staff.id, iso)];
    if (!typeId) continue;
    const shiftType = typeById.get(typeId);
    if (!shiftType) continue;
    const column = summaryColumnForCategory(shiftType.category);
    if (!column) continue;
    totals[column] += 1;
  }

  return totals;
}
