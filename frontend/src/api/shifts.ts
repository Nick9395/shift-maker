import { apiRequest } from "./client";
import { shiftTypeFromPayload, shiftTypeToPayload } from "./shiftTypes";
import { createEmptySheet, type NewShiftDraft, type ShiftTypeMaster } from "../types/shift";

export type ShiftSummary = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  public_holiday: number;
  updated_at: string;
};

export type ShiftDetail = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  public_holiday: number;
  all_locked: boolean;
  updated_at: string;
  shift_types: Array<{
    client_uuid: string;
    name: string;
    display_name: string;
    start_time: string | null;
    end_time: string | null;
    break_time: string | null;
    status: string | null;
    color: string;
  }>;
  staffs: Array<{
    id: number;
    staff_name: string;
    role_name_1: string;
    role_name_2: string;
    role_name_3: string;
  }>;
  role_counts: Array<{
    role_name: string;
    overlap_count: boolean;
    priority: boolean;
    required_count: number;
    shortage_notice: boolean;
  }>;
  plans: Array<{ date: string; body: string }>;
  locked_shift_type_uuids: string[];
  entries: Array<{
    shift_staff_id: number;
    date: string;
    shift_type_client_uuid: string | null;
  }>;
};

type ShiftListResponse = { shifts: ShiftSummary[] };
type ShiftDetailResponse = { shift: ShiftDetail };

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

/** 画面の下書きを保存APIの形に変換する */
export function toShiftSaveBody(
  draft: NewShiftDraft,
  types: ShiftTypeMaster[],
) {
  const { sheet } = draft;
  const entries = Object.entries(sheet.cells).flatMap(([key, typeId]) => {
    if (!typeId) return [];
    const [staffId, date] = key.split(":");
    if (!staffId || !date) return [];
    return [
      {
        staff_client_uuid: staffId,
        date,
        shift_type_client_uuid: typeId,
      },
    ];
  });

  const plans = Object.entries(sheet.plans)
    .filter(([, body]) => body.trim() !== "")
    .map(([date, body]) => ({ date, body }));

  return {
    name: draft.name,
    start_date: draft.startDate,
    end_date: draft.endDate,
    public_holiday: draft.holidayCount,
    all_locked: sheet.allLocked,
    shift_types: types.map(shiftTypeToPayload),
    staffs: draft.staff.map((member) => ({
      client_uuid: member.id,
      staff_name: member.name,
      role_name_1: emptyToNull(member.duty1),
      role_name_2: emptyToNull(member.duty2),
      role_name_3: emptyToNull(member.duty3),
    })),
    role_counts: draft.dutyCounts
      .filter((row) => row.dutyId.trim() !== "")
      .map((row) => ({
        role_name: row.dutyId.trim(),
        overlap_count: row.overlapCount,
        priority: row.priority,
        required_count: row.requiredCount.trim() === "" ? 0 : Number(row.requiredCount),
        shortage_notice: row.shortageNotice,
      })),
    plans,
    locked_shift_type_uuids: sheet.lockedShiftTypeIds,
    entries,
  };
}

export function shiftTypesFromDetail(shift: ShiftDetail): ShiftTypeMaster[] {
  return shift.shift_types.map(shiftTypeFromPayload);
}

export function draftFromShiftDetail(shift: ShiftDetail): NewShiftDraft {
  const cells: Record<string, string> = {};
  for (const entry of shift.entries) {
    if (!entry.shift_type_client_uuid) continue;
    cells[`${entry.shift_staff_id}:${entry.date}`] = entry.shift_type_client_uuid;
  }

  const plans: Record<string, string> = {};
  for (const plan of shift.plans) {
    plans[plan.date] = plan.body;
  }

  return {
    serverId: shift.id,
    name: shift.name,
    startDate: shift.start_date,
    endDate: shift.end_date,
    holidayCount: shift.public_holiday,
    staff: shift.staffs.map((member) => ({
      id: String(member.id),
      name: member.staff_name,
      duty1: member.role_name_1 ?? "",
      duty2: member.role_name_2 ?? "",
      duty3: member.role_name_3 ?? "",
    })),
    dutyCounts: shift.role_counts.map((row) => ({
      id: crypto.randomUUID(),
      dutyId: row.role_name,
      overlapCount: row.overlap_count,
      priority: row.priority,
      requiredCount: String(row.required_count),
      shortageNotice: row.shortage_notice,
    })),
    sheet: {
      ...createEmptySheet(),
      plans,
      cells,
      lockedShiftTypeIds: shift.locked_shift_type_uuids,
      allLocked: shift.all_locked,
    },
  };
}

export async function fetchShifts(token: string): Promise<ShiftSummary[]> {
  const { data } = await apiRequest<ShiftListResponse>("/api/v1/shifts", { token });
  return data.shifts;
}

export async function fetchShift(token: string, id: number): Promise<ShiftDetail> {
  const { data } = await apiRequest<ShiftDetailResponse>(`/api/v1/shifts/${id}`, {
    token,
  });
  return data.shift;
}

export async function createShift(
  token: string,
  draft: NewShiftDraft,
  types: ShiftTypeMaster[],
): Promise<ShiftDetail> {
  const { data } = await apiRequest<ShiftDetailResponse>("/api/v1/shifts", {
    method: "POST",
    token,
    body: { shift: toShiftSaveBody(draft, types) },
  });
  return data.shift;
}

export async function updateShift(
  token: string,
  id: number,
  draft: NewShiftDraft,
  types: ShiftTypeMaster[],
): Promise<ShiftDetail> {
  const { data } = await apiRequest<ShiftDetailResponse>(`/api/v1/shifts/${id}`, {
    method: "PATCH",
    token,
    body: { shift: toShiftSaveBody(draft, types) },
  });
  return data.shift;
}

export async function deleteShift(token: string, id: number): Promise<void> {
  await apiRequest(`/api/v1/shifts/${id}`, {
    method: "DELETE",
    token,
  });
}
