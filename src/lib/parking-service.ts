import { createServerFn } from "@tanstack/react-start";

// Official Culture Data Plaza endpoint for API_CPM_009.
// Keep the service key server-side: this module is only executed by createServerFn's handler.
const PARKING_API_URL = "https://api.kcisa.kr/openapi/API_CPM_009/request";
const SAMPLE_SIZE = 8;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type ParkingHistorySample = {
  entryAt: string;
  exitAt: string | null;
  zone: string;
};

export type ParkingHistoryResult = {
  samples: ParkingHistorySample[];
  totalCount: number | null;
  sourceYear: 2025;
  fetchedAt: string;
};

let cachedResult: ParkingHistoryResult | null = null;
let cachedAt = 0;
let activeRequest: Promise<ParkingHistoryResult> | null = null;

export const getParkingHistorySamples = createServerFn({ method: "GET" }).handler(
  async (): Promise<ParkingHistoryResult> => {
    if (cachedResult && Date.now() - cachedAt < CACHE_TTL_MS) return cachedResult;
    if (activeRequest) return activeRequest;

    activeRequest = fetchParkingHistorySamples();
    try {
      const result = await activeRequest;
      cachedResult = result;
      cachedAt = Date.now();
      return result;
    } finally {
      activeRequest = null;
    }
  },
);

async function fetchParkingHistorySamples(): Promise<ParkingHistoryResult> {
  const rawServiceKey = process.env["PARKING_SERVICE_KEY"]?.trim();
  if (!rawServiceKey) {
    throw new Error("주차 데이터 서비스 키가 서버에 설정되지 않았어요.");
  }

  const url = new URL(PARKING_API_URL);
  url.searchParams.set("serviceKey", decodeServiceKey(rawServiceKey));
  url.searchParams.set("numOfRows", String(SAMPLE_SIZE));
  url.searchParams.set("pageNo", "1");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json, application/xml;q=0.9, text/xml;q=0.8" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("주차 정보 제공기관에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  if (response.status === 429) {
    throw new Error("주차 정보 제공기관의 요청 한도가 초과됐어요. 잠시 후 다시 확인해 주세요.");
  }
  if (!response.ok) {
    throw new Error("주차 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const body = await response.text();
  const payload = parseResponseBody(body, response.headers.get("content-type") ?? "");
  const upstreamError = findUpstreamError(payload);
  if (upstreamError) throw new Error(upstreamError);

  const result = parseParkingHistoryPayload(payload);
  if (result.samples.length === 0) {
    throw new Error("응답은 받았지만 입차일시·출차일시·주차구역을 확인하지 못했어요.");
  }
  return result;
}

export function parseParkingHistoryPayload(payload: unknown): ParkingHistoryResult {
  const samples = collectRecords(payload)
    .map(toParkingSample)
    .filter((sample): sample is ParkingHistorySample => sample !== null)
    .slice(0, SAMPLE_SIZE);

  return {
    samples,
    totalCount: findNumberByKey(payload, "totalcount"),
    sourceYear: 2025,
    fetchedAt: new Date().toISOString(),
  };
}

function parseResponseBody(body: string, contentType: string): unknown {
  const trimmed = body.trim();
  if (contentType.includes("json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error("주차 데이터 응답 형식을 확인할 수 없어요.");
    }
  }
  return parseXmlPayload(trimmed);
}

function parseXmlPayload(body: string): unknown {
  const items = [...body.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => {
    const record: Record<string, string> = {};
    for (const field of match[1]?.matchAll(/<([A-Za-z0-9_가-힣]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g) ?? []) {
      if (field[1]) record[field[1]] = decodeXml(field[2] ?? "");
    }
    return record;
  });

  return {
    resultCode: decodeXml(body.match(/<resultCode>([\s\S]*?)<\/resultCode>/i)?.[1] ?? ""),
    resultMsg: decodeXml(body.match(/<resultMsg>([\s\S]*?)<\/resultMsg>/i)?.[1] ?? ""),
    totalCount: Number(body.match(/<totalCount>(\d+)<\/totalCount>/i)?.[1] ?? "") || null,
    items,
  };
}

function collectRecords(payload: unknown) {
  const records: Record<string, unknown>[] = [];

  function walk(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!isRecord(value)) return;

    const keys = Object.keys(value).map(normalizeKey);
    if (keys.some((key) => ["description", "입차일시", "entrydatetime", "parkingzone"].includes(key))) {
      records.push(value);
      return;
    }
    Object.values(value).forEach(walk);
  }

  walk(payload);
  return records;
}

function toParkingSample(record: Record<string, unknown>): ParkingHistorySample | null {
  const fields = new Map(
    Object.entries(record)
      .filter((entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number",
      )
      .map(([key, value]) => [normalizeKey(key), String(value)]),
  );
  const description = [...fields.values()].join("\n").replace(/<br\s*\/?>/gi, "\n");

  const entryAt = pick(fields, ["entrydatetime", "entryat", "indatetime", "indt", "입차일시"]) ||
    extractLabeledValue(description, ["입차일시", "입차시간", "입차일"]);
  const exitAt = pick(fields, ["exitdatetime", "exitat", "outdatetime", "outdt", "출차일시"]) ||
    extractLabeledValue(description, ["출차일시", "출차시간", "출차일"]);
  const zone = pick(fields, ["parkingzone", "parkingarea", "zone", "주차구역", "주차장"]) ||
    extractLabeledValue(description, ["주차구역", "주차장", "구역"]);

  if (!entryAt || !zone) return null;
  return {
    entryAt: cleanValue(entryAt),
    exitAt: exitAt ? cleanValue(exitAt) || null : null,
    zone: cleanValue(zone),
  };
}

function extractLabeledValue(text: string, labels: string[]) {
  const labelPattern = labels.map(escapeRegExp).join("|");
  const nextLabel = "입차일시|입차시간|입차일|출차일시|출차시간|출차일|주차구역|주차장|구역";
  const match = text.match(
    new RegExp(`(?:${labelPattern})\\s*[:：=]?\\s*([^|;,\\n]+?)(?=\\s*(?:[|;,\\n]|(?:${nextLabel})\\s*[:：=])|$)`, "i"),
  );
  return match?.[1]?.trim() ?? "";
}

function findUpstreamError(payload: unknown): string | null {
  const code = findStringByKey(payload, "resultcode").trim();
  if (!code || code === "0000") return null;
  if (code === "9999") return "주차 정보 제공기관이 점검 중이에요. 잠시 후 다시 시도해 주세요.";
  if (code === "F2013") return "주차 정보 제공기관의 서비스 주소를 호출하지 못했어요.";
  return "주차 정보 제공기관에서 요청을 처리하지 못했어요.";
}

function findStringByKey(payload: unknown, target: string): string {
  if (Array.isArray(payload)) {
    for (const value of payload) {
      const found = findStringByKey(value, target);
      if (found) return found;
    }
    return "";
  }
  if (!isRecord(payload)) return "";
  for (const [key, value] of Object.entries(payload)) {
    if (normalizeKey(key) === target && (typeof value === "string" || typeof value === "number")) {
      return String(value);
    }
  }
  for (const value of Object.values(payload)) {
    const found = findStringByKey(value, target);
    if (found) return found;
  }
  return "";
}

function findNumberByKey(payload: unknown, target: string): number | null {
  const value = Number(findStringByKey(payload, target));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function pick(fields: Map<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = fields.get(normalizeKey(alias));
    if (value?.trim()) return value.trim();
  }
  return "";
}

function decodeServiceKey(value: string) {
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cleanValue(value: string) {
  return decodeXml(value).replace(/^[\s:'"=]+|[\s,'"]+$/g, "").trim();
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeKey(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
