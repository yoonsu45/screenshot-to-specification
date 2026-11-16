import olparkEventsCsv from "@/data/olpark-events.csv?raw";

export type EventCategory = "공연" | "스포츠" | "전시" | "체험" | "축제";
export const categories = ["전체", "공연", "스포츠", "전시", "체험", "축제"] as const;
export type CategoryFilter = (typeof categories)[number];

export type ParkEvent = {
  id: string;
  sourceId?: string;
  title: string;
  facilityId: string;
  venue: string;
  category: EventCategory;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venueDetail?: string;
  address?: string;
  description?: string;
  admission?: string;
  posterFilename?: string;
  posterPath?: string;
  posterBatch?: number;
  visualConcept?: string;
  isDemo?: boolean;
  status?: string;
  posterStatus?: string;
  dataSource?: string;
  image: string;
  officialUrl?: string;
  sourceType: "demo";
};

type CsvRow = Record<string, string>;

const eventCategorySet = new Set<EventCategory>(["공연", "스포츠", "전시", "체험", "축제"]);

export function parseEventCsv(csv: string): CsvRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]!;

    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && character === ",") {
      record.push(field);
      field = "";
      continue;
    }

    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (quoted) throw new Error("행사 CSV의 따옴표가 닫히지 않았습니다.");
  record.push(field);
  if (record.some((value) => value.length > 0)) records.push(record);

  const [headers, ...rows] = records;
  if (!headers?.length) return [];

  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function required(row: CsvRow, key: string) {
  const value = row[key]?.trim();
  if (!value) throw new Error(`행사 CSV에 ${key} 값이 없습니다.`);
  return value;
}

function toParkEvent(row: CsvRow): ParkEvent {
  const categoryValue = required(row, "category");
  if (!eventCategorySet.has(categoryValue as EventCategory)) {
    throw new Error(`지원하지 않는 행사 카테고리입니다: ${categoryValue}`);
  }

  const venue = required(row, "venue");
  const park = required(row, "park");
  const posterPath = required(row, "poster_path");
  const sourceId = required(row, "id");

  return {
    id: sourceId.replace(/^OP-DEMO-/, "OLP-DEMO-"),
    sourceId,
    title: required(row, "title"),
    facilityId: "olympic-park",
    category: categoryValue as EventCategory,
    startDate: required(row, "start_date"),
    endDate: required(row, "end_date"),
    startTime: required(row, "start_time"),
    endTime: required(row, "end_time"),
    venue,
    venueDetail: `${park} · ${venue}`,
    address: required(row, "address"),
    description: required(row, "description"),
    admission: required(row, "admission"),
    posterFilename: required(row, "poster_filename"),
    posterPath,
    posterBatch: Number(required(row, "poster_batch")),
    visualConcept: required(row, "visual_concept"),
    isDemo: required(row, "is_demo").toLowerCase() === "true",
    dataSource: required(row, "data_source"),
    status: required(row, "status"),
    posterStatus: required(row, "poster_status"),
    image: posterPath.startsWith("/") ? posterPath : `/${posterPath}`,
    sourceType: "demo",
  };
}

export const events: ParkEvent[] = parseEventCsv(olparkEventsCsv).map(toParkEvent);
