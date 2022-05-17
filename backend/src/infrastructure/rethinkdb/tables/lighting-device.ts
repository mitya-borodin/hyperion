import { Connection } from "rethinkdb-ts";

import { LightingDeviceState } from "../../../domain/lighting/lighting-device";
import { createTable, db } from "../common";

const tableName = "lighting-device";

export type LightingDeviceTableHistory = {
  readonly placeOfInstallation: string;
  readonly turnedOnAt: string | null;
  readonly turnedOffAt: string | null;
  readonly workedMs: number | null;
};

export type LightingDeviceTable = {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly power: string;
  readonly lumens: string;
  readonly lightTemperatureKelvin: number;
  readonly resourceMs: number;
  readonly price: string;
  readonly currency: string;
  readonly sellersWebsite: string;
  readonly images: string[];
  readonly placeOfInstallation: string;
  readonly state: LightingDeviceState;
  readonly history: LightingDeviceTableHistory[];
  readonly totalWorkedMs: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const lightingDeviceTable = db.table<LightingDeviceTable>(tableName);

export async function createLightingDeviceTable(
  rethinkdbConnection: Connection,
  tableReplicas: number,
): Promise<void> {
  await createTable(rethinkdbConnection, tableName, "id", tableReplicas);
}
