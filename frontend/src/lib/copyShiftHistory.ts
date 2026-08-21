import { createEmptySheet, type NewShiftDraft } from "../types/shift";

export const UNKNOWN_STAFF_NAME = "不明な職員";

/** 履歴の職員・カウントを今のマスタに合わせてコピーする（シートは空） */
export function copySettingsFromHistory({
  source,
  staffNames,
  dutyNames,
  shiftTypeIds,
}: {
  source: NewShiftDraft;
  staffNames: ReadonlySet<string>;
  dutyNames: ReadonlySet<string>;
  shiftTypeIds: ReadonlySet<string>;
}): Pick<NewShiftDraft, "staff" | "dutyCounts" | "shiftCounts" | "sheet"> {
  const staff = source.staff.map((row) => {
    const name = row.name.trim();
    const duty1 = row.duty1.trim();
    const duty2 = row.duty2.trim();
    const duty3 = row.duty3.trim();
    return {
      id: crypto.randomUUID(),
      name: name && staffNames.has(name) ? name : UNKNOWN_STAFF_NAME,
      duty1: dutyNames.has(duty1) ? duty1 : "",
      duty2: dutyNames.has(duty2) ? duty2 : "",
      duty3: dutyNames.has(duty3) ? duty3 : "",
    };
  });

  const dutyCounts = source.dutyCounts
    .filter((row) => dutyNames.has(row.dutyId.trim()))
    .map((row) => ({
      ...row,
      id: crypto.randomUUID(),
      dutyId: row.dutyId.trim(),
    }));

  const shiftCounts = source.shiftCounts.map((row) => {
    const ids = row.shiftTypeIds.filter(
      (id) => id.trim() !== "" && shiftTypeIds.has(id),
    );
    return {
      ...row,
      id: crypto.randomUUID(),
      shiftTypeIds: ids.length > 0 ? ids : [""],
    };
  });

  return {
    staff,
    dutyCounts,
    shiftCounts,
    sheet: createEmptySheet(),
  };
}
