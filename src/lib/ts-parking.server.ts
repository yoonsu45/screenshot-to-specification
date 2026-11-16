import { joinTsParking, type TsParkingResult } from "./ts-parking";

let cache: { until: number; pending: Promise<TsParkingResult> } | undefined;
export function readTsParking() {
  if (cache && cache.until > Date.now()) return cache.pending;
  const pending = request();
  cache = { until: Date.now() + 60000, pending };
  return pending;
}

async function request(): Promise<TsParkingResult> {
  const fetchedAt = new Date().toISOString();
  const key = process.env["TS_PARKING_API_SERVICE_KEY"]?.trim();
  if (!key) return { status: "missing_key", fetchedAt, lots: [] };
  try {
    let decoded = key;
    try { decoded = decodeURIComponent(key); } catch { /* raw key */ }
    const load = async (method: string) => {
      const url = new URL(`https://apis.data.go.kr/B553881/Parking_v1/${method}_v1`);
      for (const [name, value] of Object.entries({ serviceKey: decoded, pageNo: "1", numOfRows: "1000", format: "2", sidoCd: "11", sigunguCd: "11710" })) url.searchParams.set(name, value);
      const response = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "error" });
      if (!response.ok) throw new Error("Parking request failed");
      return response.json();
    };
    // Bounded candidate lookup, not an exhaustive district inventory. Facility
    // results can exceed one page; unmatched live IDs are omitted, not guessed.
    const [facility, live] = await Promise.all([load("PrkSttusInfo"), load("PrkRealtimeInfo")]);
    return { status: "ok", fetchedAt: new Date().toISOString(), lots: joinTsParking(facility, live) };
  } catch {
    return { status: "unavailable", fetchedAt, lots: [] };
  }
}
