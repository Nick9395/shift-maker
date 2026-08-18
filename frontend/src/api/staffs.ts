import { apiRequest } from "./client";
import { type StaffMaster } from "../types/shift";

type StaffPayload = {
  client_uuid: string;
  name: string;
};

type StaffsResponse = { staffs: StaffPayload[] };

export function staffFromPayload(row: StaffPayload): StaffMaster {
  return {
    id: row.client_uuid,
    name: row.name,
  };
}

export async function fetchStaffs(token: string): Promise<StaffMaster[]> {
  const { data } = await apiRequest<StaffsResponse>("/api/v1/staffs", { token });
  return data.staffs.map(staffFromPayload);
}

export async function replaceStaffs(
  token: string,
  staffs: StaffMaster[],
): Promise<StaffMaster[]> {
  const { data } = await apiRequest<StaffsResponse>("/api/v1/staffs", {
    method: "PUT",
    token,
    body: {
      staffs: staffs.map((row) => ({
        client_uuid: row.id,
        name: row.name,
      })),
    },
  });
  return data.staffs.map(staffFromPayload);
}
