export type TsParkingLot = { id: string; name: string; address: string; capacity: number; remaining: number; latitude: number; longitude: number };
export type TsParkingResult = { status: "ok" | "missing_key" | "unavailable"; fetchedAt: string; lots: TsParkingLot[] };

function nonnegative(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export function joinTsParking(facilities: unknown, realtime: unknown): TsParkingLot[] {
  const parse = (payload: unknown, field: string): Record<string, unknown>[] => {
    if (!payload || typeof payload !== "object") throw new Error("Invalid response");
    const data = payload as Record<string, unknown>;
    if (String(data["resultCode"]) !== "0" || !Array.isArray(data[field])) throw new Error("Invalid response");
    return data[field].filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  };
  const index = new Map(parse(facilities, "PrkSttusInfo").map((row) => [row["prk_center_id"], row]));
  const result: TsParkingLot[] = [];
  for (const row of parse(realtime, "PrkRealtimeInfo")) {
    const facility = index.get(row["prk_center_id"]);
    if (!facility || facility["prk_manage_agent"] !== "1") continue;
    const capacity = nonnegative(row["pkfc_ParkingLots_total"]);
    const remaining = nonnegative(row["pkfc_Available_ParkingLots_total"]);
    if (capacity === null || capacity === 0 || remaining === null || remaining > capacity || nonnegative(facility["prk_cmprt_co"]) !== capacity) continue;
    const latitude = Number(facility["prk_plce_entrc_la"]), longitude = Number(facility["prk_plce_entrc_lo"]);
    // Limit to the Olympic Park vicinity; these bounds are not walking distances.
    if (!(latitude >= 37.50 && latitude <= 37.54 && longitude >= 127.10 && longitude <= 127.15)) continue;
    if (typeof facility["prk_plce_nm"] !== "string" || !facility["prk_plce_nm"].trim() || typeof facility["prk_plce_adres"] !== "string" || typeof row["prk_center_id"] !== "string") continue;
    result.push({ id: row["prk_center_id"], name: facility["prk_plce_nm"], address: facility["prk_plce_adres"], capacity, remaining, latitude, longitude });
  }
  return result;
}
