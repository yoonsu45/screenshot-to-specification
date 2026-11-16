export type SeoulParkingLot = {
  id: string;
  name: string;
  address: string;
  capacity: number | null;
  occupied: number | null;
  updatedAt: string | null;
  linked: boolean;
  latitude: number | null;
  longitude: number | null;
};
export type SeoulParkingResult = {
  status: "ok" | "unavailable" | "missing_key";
  fetchedAt: string;
  lots: SeoulParkingLot[];
};

// External alternatives only; not a proximity ranking or a claim of walking access.
const candidateIds = ["173646", "173867", "1277145", "1475224"];

function count(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return null;
  return value;
}

function coordinate(value: unknown, minimum: number, maximum: number): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

export function parseSeoulParking(payload: unknown): SeoulParkingLot[] {
  if (!payload || typeof payload !== "object") throw new Error("Invalid response");
  const service = (payload as Record<string, unknown>)["GetParkingInfo"] as Record<string, unknown> | undefined;
  if (!service || (service["RESULT"] as Record<string, unknown> | undefined)?.["CODE"] !== "INFO-000" || !Array.isArray(service["row"])) {
    throw new Error("Seoul parking unavailable");
  }
  const lots = new Map<string, SeoulParkingLot>();
  for (const item of service["row"] as unknown[]) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row["PKLT_CD"] ?? "");
    if (!candidateIds.includes(id) || typeof row["PKLT_NM"] !== "string" || typeof row["ADDR"] !== "string") continue;
    const time = row["NOW_PRK_VHCL_UPDT_TM"];
    lots.set(id, {
      id, name: row["PKLT_NM"], address: row["ADDR"],
      capacity: count(row["TPKCT"]), occupied: count(row["NOW_PRK_VHCL_CNT"]),
      linked: String(row["PRK_STTS_YN"]) === "1",
      updatedAt: typeof time === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time) ? time : null,
      latitude: coordinate(row["LAT"], 31.43, 44.35),
      longitude: coordinate(row["LNG"] ?? row["LOT"], 122.37, 132),
    });
  }
  return candidateIds.flatMap((id) => lots.has(id) ? [lots.get(id)!] : []);
}

export function getSeoulAvailability(lot: SeoulParkingLot, now = Date.now()) {
  const timestamp = lot.updatedAt ? Date.parse(lot.updatedAt.replace(" ", "T") + "+09:00") : NaN;
  const age = now - timestamp;
  if (!lot.linked || !Number.isFinite(age) || age < -60000 || age > 20 * 60000 ||
    lot.capacity === null || lot.capacity <= 0 || lot.occupied === null || lot.occupied > lot.capacity) return null;
  const remaining = lot.capacity - lot.occupied;
  const ratio = lot.occupied / lot.capacity;
  return {
    remaining,
    label: remaining === 0 ? "만차" : ratio >= 0.9 ? "혼잡" : ratio >= 0.7 ? "보통" : "여유",
  };
}
