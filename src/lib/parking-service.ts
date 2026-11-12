import { createServerFn } from "@tanstack/react-start";

const PARKING_API_URL = "https://api.kcisa.kr/openapi/API_CPM_008/request";
const SAMPLE_SIZE = 5;

export type ParkingSample = {
  entryAt: string;
  exitAt: string | null;
  zone: string;
};

export type ParkingSampleResult = {
  samples: ParkingSample[];
  totalCount: number | null;
  sourceYear: 2025;
  fetchedAt: string;
  notice: string | null;
};

export const getParkingSamples = createServerFn({ method: "GET" }).handler(
  async (): Promise<ParkingSampleResult> => {
    const serviceKey = process.env["PARKING_SERVICE_KEY"]?.trim();
    if (!serviceKey) {
      throw new Error("주차 API 서비스 키가 서버에 설정되지 않았어요.");
    }

    const url = new URL(PARKING_API_URL);
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("numOfRows", String(SAMPLE_SIZE));
    url.searchParams.set("pageNo", "1");

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json, application/xml;q=0.9" },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new Error("주차 정보 제공기관에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }

    if (!response.ok) {
      throw new Error(`주차 데이터를 불러오지 못했어요. (HTTP ${response.status})`);
    }

    const body = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const payload =
      contentType.includes("json") || body.trimStart().startsWith("{")
        ? safelyParseJson(body)
        : parseXmlPayload(body);

    return parseParkingPayload(payload);
  },
);

export function parseParkingPayload(payload: unknown): ParkingSampleResult {
  const records = collectRecords(payload);
  const samples = records
    .map(toParkingSample)
    .filter((sample): sample is ParkingSample => sample !== null)
    .slice(0, SAMPLE_SIZE);

  return {
    samples,
    totalCount: findTotalCount(payload),
    sourceYear: 2025,
    fetchedAt: new Date().toISOString(),
    notice: samples.length
      ? null
      : "응답은 받았지만 입차일시·출차일시·주차구역을 확인할 수 있는 표본이 없어요.",
  };
}

function safelyParseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("주차 데이터 응답 형식을 확인할 수 없어요.");
  }
}

function parseXmlPayload(body: string): unknown {
  const items = [...body.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => {
    const record: Record<string, string> = {};
    for (const field of match[1]?.matchAll(/<([A-Za-z0-9_가-힣]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g) ??
      []) {
      if (field[1]) record[field[1]] = decodeXml(field[2] ?? "");
    }
    return record;
  });
  const totalCount = body.match(/<totalCount>(\d+)<\/totalCount>/i)?.[1];
  return { items, totalCount: totalCount ? Number(totalCount) : undefined };
}

function collectRecords(payload: unknown) {
  const records: Record<string, unknown>[] = [];

  function walk(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!isRecord(value)) return;

    const normalizedKeys = Object.keys(value).map(normalizeKey);
    const looksLikeItem = normalizedKeys.some((key) =>
      [
        "title",
        "description",
        "subdescription",
        "entryat",
        "entrydatetime",
        "parkingzone",
        "입차일시",
        "주차구역",
      ].includes(key),
    );
    if (looksLikeItem) records.push(value);
    else Object.values(value).forEach(walk);
  }

  walk(payload);
  return records;
}

function toParkingSample(record: Record<string, unknown>): ParkingSample | null {
  const fields = new Map(
    Object.entries(record)
      .filter(
        (entry): entry is [string, string | number] =>
          typeof entry[1] === "string" || typeof entry[1] === "number",
      )
      .map(([key, value]) => [normalizeKey(key), String(value)]),
  );
  const combined = [...fields.values()]
    .map((value) => value.replace(/<br\s*\/?>/gi, "\n"))
    .join("\n");

  const entryAt =
    pick(fields, [
      "entryat",
      "entrydatetime",
      "entrancedatetime",
      "indt",
      "indatetime",
      "carindt",
      "입차일시",
    ]) || extractLabeledValue(combined, ["입차일시", "입차시간", "입차일"]);
  const exitAt =
    pick(fields, ["exitat", "exitdatetime", "outdt", "outdatetime", "caroutdt", "출차일시"]) ||
    extractLabeledValue(combined, ["출차일시", "출차시간", "출차일"]);
  const zone =
    pick(fields, ["zone", "parkingzone", "parkingarea", "parkinglot", "주차구역", "주차장"]) ||
    extractLabeledValue(combined, ["주차구역", "주차장", "구역"]);

  if (!entryAt || !zone) return null;
  return {
    entryAt: cleanValue(entryAt),
    exitAt: exitAt && cleanValue(exitAt) ? cleanValue(exitAt) : null,
    zone: cleanValue(zone),
  };
}

function extractLabeledValue(text: string, labels: string[]) {
  const labelPattern = labels.map(escapeRegExp).join("|");
  const nextLabel = "입차일시|입차시간|입차일|출차일시|출차시간|출차일|주차구역|주차장|구역";
  const match = text.match(
    new RegExp(
      `(?:${labelPattern})\\s*[:：=]?\\s*([^|;,\\n]+?)(?=\\s*(?:[|;,\\n]|(?:${nextLabel})\\s*[:：=])|$)`,
      "i",
    ),
  );
  return match?.[1]?.trim() ?? "";
}

function pick(fields: Map<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = fields.get(normalizeKey(alias));
    if (value?.trim()) return value.trim();
  }
  return "";
}

function findTotalCount(payload: unknown): number | null {
  if (Array.isArray(payload)) {
    for (const value of payload) {
      const count = findTotalCount(value);
      if (count !== null) return count;
    }
    return null;
  }
  if (!isRecord(payload)) return null;

  for (const [key, value] of Object.entries(payload)) {
    if (normalizeKey(key) === "totalcount") {
      const count = Number(value);
      return Number.isFinite(count) ? count : null;
    }
  }
  for (const value of Object.values(payload)) {
    const count = findTotalCount(value);
    if (count !== null) return count;
  }
  return null;
}

function cleanValue(value: string) {
  return decodeXml(value)
    .replace(/^[\s:'"=]+|[\s,'"]+$/g, "")
    .trim();
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
