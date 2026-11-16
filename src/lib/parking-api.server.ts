import { parseLiveParking, parseParkingHistory, type ParkingSource, type ParkingOverview } from "./parking-data";

type CacheEntry = { expires: number; pending: Promise<ParkingSource> };
const cache = new Map<string, CacheEntry>();

function cached(name: string, ttl: number, request: () => Promise<ParkingSource>) {
  const existing = cache.get(name);
  if (existing && existing.expires > Date.now()) return existing.pending;
  const pending = request();
  cache.set(name, { expires: Date.now() + ttl, pending });
  return pending;
}

async function readSource(endpoint: string, keyName?: string): Promise<ParkingSource> {
  const fetchedAt = new Date().toISOString();
  const empty = { fetchedAt, readings: [] };
  const key = keyName ? process.env[keyName]?.trim() : undefined;
  if (keyName && !key) return { ...empty, status: "missing_key" };
  try {
    const url = new URL(endpoint);
    if (key) {
      // Support both the raw and URL-encoded key provided by the portal.
      let decoded = key;
      try { decoded = decodeURIComponent(key); } catch { /* use raw key */ }
      url.searchParams.set("serviceKey", decoded);
      url.searchParams.set("numOfRows", "5");
      url.searchParams.set("pageNo", "1");
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) return { ...empty, status: "unavailable" };
    const readings = keyName
      ? parseParkingHistory(await response.text())
      : [{ at: fetchedAt, count: parseLiveParking(await response.json()) }];
    return { status: "ok", fetchedAt, readings };
  } catch {
    // Do not expose upstream request URLs, keys, bodies, or exceptions.
    return { ...empty, status: "unavailable" };
  }
}

export async function readParkingOverview(): Promise<ParkingOverview> {
  const [live, flow, context] = await Promise.all([
    cached("live", 60000, () => readSource("https://www.ksponco.or.kr/online/main/parkingorsApi.do?apiKey=PARKING21803504")),
    cached("flow", 300000, () => readSource("https://api.kcisa.kr/openapi/API_CPM_008/request", "CULTURE_PARKING_FLOW_API_SERVICE_KEY")),
    cached("context", 300000, () => readSource("https://api.kcisa.kr/openapi/API_CPM_009/request", "CULTURE_API_SERVICE_KEY")),
  ]);
  return { live, flow, context };
}
