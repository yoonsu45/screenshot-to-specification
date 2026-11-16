export type ParkingReading = { at: string; count: number };

// User confirmed on 2026-11-16: parking_sum is occupied vehicles;
// 2,200 is the capacity used for this aggregate. Do not apply to individual lots.
export const PARK_AGGREGATE_CAPACITY = 2200;

export function getParkAvailability(occupied: number) {
  if (!Number.isSafeInteger(occupied) || occupied < 0 || occupied > PARK_AGGREGATE_CAPACITY) return null;
  const remaining = PARK_AGGREGATE_CAPACITY - occupied;
  const ratio = occupied / PARK_AGGREGATE_CAPACITY;
  return {
    remaining,
    label: remaining === 0 ? "만차" : ratio >= 0.9 ? "혼잡" : ratio >= 0.7 ? "보통" : "여유",
  };
}
export type ParkingSource = {
  status: "ok" | "unavailable" | "missing_key";
  fetchedAt: string;
  readings: ParkingReading[];
};
export type ParkingOverview = {
  live: ParkingSource;
  flow: ParkingSource;
  context: ParkingSource;
};

export function parseLiveParking(payload: unknown): number {
  if (!Array.isArray(payload) || payload.length !== 1) throw new Error("Invalid parking response");
  const value: unknown = payload[0]?.parking_sum;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Invalid parking count");
  }
  return value;
}

// Only extract the documented scalar fields. Never render upstream markup or infer
// occupancy from entry/exit totals without a verified opening balance.
export function parseParkingHistory(xml: string): ParkingReading[] {
  const field = (text: string, name: string) =>
    new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(text)?.[1]
      ?.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim() ?? "";
  if (field(xml, "resultCode") !== "0000") throw new Error("Parking API error");
  const readings: ParkingReading[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = match[1]!;
    const at = field(item, "ISSUED_DATE");
    const countText = /(?:^|,)\s*주차대수\s*:\s*(\d+)\s*(?=,|$)/.exec(field(item, "DESCRIPTION"))?.[1];
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(at) || countText === undefined) continue;
    const count = Number(countText);
    if (Number.isSafeInteger(count)) readings.push({ at, count });
  }
  return readings.sort((a, b) => a.at.localeCompare(b.at));
}

export const PARKING_GUIDE_URL = "https://www.ksponco.or.kr/olympicpark/parkingInfo?mid=a20111000000";

export type ParkingMapDestination = {
  name: string;
  latitude: number;
  longitude: number;
};

// Coordinates point to the parking areas shown on the official Olympic Park map.
// Fixed coordinates prevent NAVER Map from resolving short labels such as "P5"
// to an unrelated place.
const parkingMapDestinations: Record<string, ParkingMapDestination> = {
  "P1A": { name: "올림픽공원 주차장 P1A", latitude: 37.5147, longitude: 127.1244 },
  "P1B": { name: "올림픽공원 주차장 P1B", latitude: 37.5152, longitude: 127.126 },
  "P2": { name: "올림픽공원 주차장 P2", latitude: 37.51555, longitude: 127.12796 },
  "P2 · 올림픽홀 지하주차장": { name: "올림픽공원 P2 · 올림픽홀 지하주차장", latitude: 37.51555, longitude: 127.12796 },
  "P4": { name: "올림픽공원 주차장 P4", latitude: 37.52167, longitude: 127.12492 },
  "P5": { name: "올림픽공원 주차장 P5", latitude: 37.51833, longitude: 127.12789 },
  "P6": { name: "올림픽공원 주차장 P6", latitude: 37.51642, longitude: 127.12628 },
  "P7": { name: "올림픽공원 주차장 P7", latitude: 37.51589, longitude: 127.12371 },
  "그래피티의 벽 주차장": { name: "올림픽공원 그래피티의 벽 주차장", latitude: 37.51762, longitude: 127.12921 },
  "서1문 주차장": { name: "올림픽공원 서1문 주차장", latitude: 37.51978, longitude: 127.11067 },
  "남3문 주차장": { name: "올림픽공원 남3문 주차장", latitude: 37.51539, longitude: 127.11767 },
  "남4문 주차장": { name: "올림픽공원 남4문 주차장", latitude: 37.51654, longitude: 127.11434 },
};

export function getParkingMapDestination(name: string) {
  const normalized = name.replace(/\s*\([^)]*\)\s*$/, "");
  return parkingMapDestinations[name] ?? parkingMapDestinations[normalized] ?? null;
}

// Static guidance checked against the official destination/parking guide.
// Alternatives are candidate areas, not a claim that space is available.
export function getVenueParking(venue: string) {
  const guides: Record<string, { primary: string; alternatives: string[] }> = {
    "KSPO-DOME": { primary: "P5", alternatives: ["P4", "P2"] },
    "티켓링크 라이브 아레나": { primary: "P6", alternatives: ["P7", "P2"] },
    "우리금융아트홀": { primary: "P7", alternatives: ["P6", "P1A"] },
    "올림픽홀": { primary: "P2 · 올림픽홀 지하주차장", alternatives: ["P1B", "P6"] },
    "뮤즈라이브": { primary: "P2", alternatives: ["P6", "P7"] },
    "만남의 광장": { primary: "그래피티의 벽 주차장", alternatives: ["P2", "P1B"] },
    "88마당": { primary: "P2", alternatives: ["P6", "P7"] },
    "한얼광장": { primary: "P6", alternatives: ["P5", "P7"] },
    "피크닉 광장": { primary: "P4", alternatives: ["P5", "P2"] },
    "수변무대": { primary: "P4", alternatives: ["P5", "서1문 주차장"] },
    "평화의 광장": { primary: "서1문 주차장", alternatives: ["남4문 주차장 (친환경 차량 구역 확인)", "남3문 주차장"] },
  };
  return guides[venue] ?? null;
}
