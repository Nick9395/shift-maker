import { sheetCellKey } from "../types/shift";
import type {
  DutyCountDraft,
  ShiftStaffDraft,
  ShiftTypeCategory,
  ShiftTypeMaster,
} from "../types/shift";

/** 職務カウントで出勤とみなす種別。出張・休み系は含めない */
export const WORKING_SHIFT_CATEGORIES: ReadonlySet<ShiftTypeCategory> = new Set([
  "早朝勤務",
  "日中勤務",
  "夕方勤務",
  "夜間勤務",
]);

type DutyCountSetting = {
  id: string;
  dutyName: string;
  overlap: boolean;
  required: number | null;
};

function parseRequired(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

function uniqueStaffDuties(staff: ShiftStaffDraft): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const slot of [staff.duty1, staff.duty2, staff.duty3]) {
    const name = slot.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

function activeSettings(dutyCounts: DutyCountDraft[]): DutyCountSetting[] {
  const seen = new Set<string>();
  const settings: DutyCountSetting[] = [];
  for (const row of dutyCounts) {
    const dutyName = row.dutyId.trim();
    if (!dutyName || seen.has(dutyName)) continue;
    seen.add(dutyName);
    settings.push({
      id: row.id,
      dutyName,
      overlap: row.overlapCount,
      required: parseRequired(row.requiredCount),
    });
  }
  return settings;
}

function isStaffWorking(
  staff: ShiftStaffDraft,
  isoDate: string,
  cells: Record<string, string>,
  typeById: Map<string, ShiftTypeMaster>,
): boolean {
  const typeId = cells[sheetCellKey(staff.id, isoDate)];
  if (!typeId) return false;
  const shiftType = typeById.get(typeId);
  if (!shiftType) return false;
  return WORKING_SHIFT_CATEGORIES.has(
    shiftType.category as ShiftTypeCategory,
  );
}

function pickRemainderDuty(
  exclusiveOwned: string[],
  settingsByName: Map<string, DutyCountSetting>,
  totals: Map<string, number>,
): string | null {
  if (exclusiveOwned.length === 0) return null;

  const underQuota = exclusiveOwned.filter((name) => {
    const setting = settingsByName.get(name);
    if (!setting) return false;
    if (setting.required == null) return true;
    return (totals.get(setting.id) ?? 0) < setting.required;
  });

  return underQuota[0] ?? exclusiveOwned[0] ?? null;
}

/** 1日分の職務カウント。行ID → 人数 */
export function countDutiesForDate(params: {
  staff: ShiftStaffDraft[];
  dutyCounts: DutyCountDraft[];
  cells: Record<string, string>;
  types: ShiftTypeMaster[];
  isoDate: string;
}): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of params.dutyCounts) {
    totals.set(row.id, 0);
  }

  const settings = activeSettings(params.dutyCounts);
  if (settings.length === 0) return totals;

  const typeById = new Map(params.types.map((type) => [type.id, type]));
  const overlap = settings.filter((row) => row.overlap);
  const exclusive = settings.filter((row) => !row.overlap);
  const exclusiveByName = new Map(exclusive.map((row) => [row.dutyName, row]));

  const dutiesByStaff = new Map(
    params.staff.map((member) => [member.id, uniqueStaffDuties(member)]),
  );

  function bump(settingId: string) {
    totals.set(settingId, (totals.get(settingId) ?? 0) + 1);
  }

  for (const member of params.staff) {
    if (!isStaffWorking(member, params.isoDate, params.cells, typeById)) {
      continue;
    }
    const owned = new Set(dutiesByStaff.get(member.id) ?? []);
    for (const setting of overlap) {
      if (owned.has(setting.dutyName)) bump(setting.id);
    }
  }

  const assigned = new Set<string>();

  for (const setting of exclusive) {
    if (setting.required == null || setting.required <= 0) continue;
    let filled = 0;
    for (const member of params.staff) {
      if (filled >= setting.required) break;
      if (assigned.has(member.id)) continue;
      if (!isStaffWorking(member, params.isoDate, params.cells, typeById)) {
        continue;
      }
      const owned = dutiesByStaff.get(member.id) ?? [];
      if (!owned.includes(setting.dutyName)) continue;
      assigned.add(member.id);
      bump(setting.id);
      filled += 1;
    }
  }

  for (const member of params.staff) {
    if (assigned.has(member.id)) continue;
    if (!isStaffWorking(member, params.isoDate, params.cells, typeById)) {
      continue;
    }
    const exclusiveOwned = (dutiesByStaff.get(member.id) ?? []).filter((name) =>
      exclusiveByName.has(name),
    );
    const picked = pickRemainderDuty(
      exclusiveOwned,
      exclusiveByName,
      totals,
    );
    if (!picked) continue;
    const setting = exclusiveByName.get(picked);
    if (!setting) continue;
    assigned.add(member.id);
    bump(setting.id);
  }

  return totals;
}

/** 不足通知ONかつ実数が必要人数未満なら true */
export function isDutyCountShort(
  row: DutyCountDraft,
  actual: number,
): boolean {
  if (!row.shortageNotice) return false;
  const required = parseRequired(row.requiredCount);
  if (required == null) return false;
  return actual < required;
}
