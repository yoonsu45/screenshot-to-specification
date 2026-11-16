import { parseSeoulParking, type SeoulParkingResult } from "./seoul-parking";

let cached: { until: number; pending: Promise<SeoulParkingResult> } | undefined;

export function readSeoulParking(): Promise<SeoulParkingResult> {
  if (cached && cached.until > Date.now()) return cached.pending;
  const pending = requestSeoulParking();
  cached = { until: Date.now() + 60000, pending };
  return pending;
}

async function requestSeoulParking(): Promise<SeoulParkingResult> {
  const fetchedAt = new Date().toISOString();
  const key = process.env["SEOUL_OPEN_DATA_API_KEY"]?.trim();
  if (!key) return { status: "missing_key", fetchedAt, lots: [] };
  try {
    // Official Seoul endpoint uses HTTP port 8088 (HTTPS is not supported there).
    // This URL, including the credential path, must never be returned or logged.
    const url = `http://openapi.seoul.go.kr:8088/${encodeURIComponent(key)}/json/GetParkingInfo/1/1000/`;
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "error" });
    if (!response.ok) throw new Error("Seoul request failed");
    return { status: "ok", fetchedAt, lots: parseSeoulParking(await response.json()) };
  } catch {
    return { status: "unavailable", fetchedAt, lots: [] };
  }
}
