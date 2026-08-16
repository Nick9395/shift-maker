import { apiRequest } from "./client";
import {
  loadShiftTypes as loadLocalShiftTypes,
  saveShiftTypes as saveLocalShiftTypes,
} from "../lib/shiftTypeStore";
import type { ShiftTypeMaster } from "../types/shift";

export type ShiftTypePayload = {
  client_uuid: string;
  name: string;
  display_name: string;
  start_time: string | null;
  end_time: string | null;
  break_time: string | null;
  status: string | null;
  color: string | null;
};

type ShiftTypesResponse = { shift_types: ShiftTypePayload[] };

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function shiftTypeToPayload(type: ShiftTypeMaster): ShiftTypePayload {
  return {
    client_uuid: type.id,
    name: type.name,
    display_name: type.abbreviation,
    start_time: emptyToNull(type.startTime),
    end_time: emptyToNull(type.endTime),
    break_time: emptyToNull(type.breakTime),
    status: emptyToNull(type.category),
    color: emptyToNull(type.iconColor),
  };
}

export function shiftTypeFromPayload(type: ShiftTypePayload): ShiftTypeMaster {
  return {
    id: type.client_uuid,
    name: type.name,
    abbreviation: type.display_name ?? "",
    startTime: type.start_time ?? "",
    endTime: type.end_time ?? "",
    breakTime: type.break_time ?? "",
    category: (type.status ?? "") as ShiftTypeMaster["category"],
    iconColor: type.color ?? "",
  };
}

export async function fetchShiftTypes(token: string): Promise<ShiftTypeMaster[]> {
  const { data } = await apiRequest<ShiftTypesResponse>("/api/v1/shift_types", {
    token,
  });
  return data.shift_types.map(shiftTypeFromPayload);
}

export async function replaceShiftTypes(
  token: string,
  types: ShiftTypeMaster[],
): Promise<ShiftTypeMaster[]> {
  const { data } = await apiRequest<ShiftTypesResponse>("/api/v1/shift_types", {
    method: "PUT",
    token,
    body: { shift_types: types.map(shiftTypeToPayload) },
  });
  const saved = data.shift_types.map(shiftTypeFromPayload);
  saveLocalShiftTypes(saved);
  return saved;
}

/** DBの種別を読み、空なら localStorage から一度だけ移行する */
export async function loadShiftTypesForUser(
  token: string,
): Promise<ShiftTypeMaster[]> {
  const remote = await fetchShiftTypes(token);
  if (remote.length > 0) {
    saveLocalShiftTypes(remote);
    return remote;
  }

  const local = loadLocalShiftTypes();
  if (local.length === 0) return [];

  return replaceShiftTypes(token, local);
}
