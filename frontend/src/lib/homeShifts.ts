import type { ShiftSummary } from "../api/shifts";

export const HOME_RECENT_LIMIT = 3;

function newerFirst(left: string, right: string): number {
  return new Date(right).getTime() - new Date(left).getTime();
}

/** 最後に更新した1件と、それ以外の最近編集した3件に分ける */
export function splitHomeShifts(shifts: ShiftSummary[]): {
  latestUpdated: ShiftSummary | null;
  recent: ShiftSummary[];
} {
  const byUpdated = [...shifts].sort((left, right) => {
    const compared = newerFirst(left.updated_at, right.updated_at);
    return compared !== 0 ? compared : right.id - left.id;
  });
  const latestUpdated = byUpdated[0] ?? null;
  const recent = byUpdated
    .filter((shift) => shift.id !== latestUpdated?.id)
    .slice(0, HOME_RECENT_LIMIT);

  return { latestUpdated, recent };
}
