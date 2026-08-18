import { apiRequest } from "./client";
import { type DutyMaster } from "../types/shift";

type RolePayload = {
  client_uuid: string;
  name: string;
  abbreviation: string;
};

type RolesResponse = { roles: RolePayload[] };

export function dutyFromPayload(row: RolePayload): DutyMaster {
  return {
    id: row.client_uuid,
    name: row.name,
    abbreviation: row.abbreviation ?? "",
  };
}

export async function fetchDuties(token: string): Promise<DutyMaster[]> {
  const { data } = await apiRequest<RolesResponse>("/api/v1/roles", { token });
  return data.roles.map(dutyFromPayload);
}

export async function replaceDuties(
  token: string,
  duties: DutyMaster[],
): Promise<DutyMaster[]> {
  const { data } = await apiRequest<RolesResponse>("/api/v1/roles", {
    method: "PUT",
    token,
    body: {
      roles: duties.map((row) => ({
        client_uuid: row.id,
        name: row.name,
        abbreviation: row.abbreviation,
      })),
    },
  });
  return data.roles.map(dutyFromPayload);
}
