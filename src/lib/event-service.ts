// 행사 조회와 대조 로직을 한곳에 모은 서비스 계층.
// 실제 API를 붙일 때는 이 파일의 함수 내부만 바꾸면 화면은 그대로 동작합니다.
import { events, type CategoryFilter, type ParkEvent } from "@/data/events";
import { ALL_FACILITIES_ID, getFacility } from "@/data/facilities";
import { officialEvents, officialRecordSource } from "@/lib/official-data";
import { getOfficialSchedule } from "@/lib/official-posters";

export type ListResult =
  { kind: "not-connected" } | { kind: "empty" } | { kind: "ok"; events: ParkEvent[] };

export function listEvents(facilityId: string, category: CategoryFilter): ListResult {
  const facility = getFacility(facilityId);
  if (!facility || !facility.connected) return { kind: "not-connected" };
  const scoped =
    facilityId === ALL_FACILITIES_ID ? events : events.filter((e) => e.facilityId === facilityId);
  const filtered = (category === "전체" ? scoped : scoped.filter((e) => e.category === category))
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return filtered.length ? { kind: "ok", events: filtered } : { kind: "empty" };
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export type CheckInput = {
  title: string;
  date: string;
  venue: string;
  image?: string | undefined;
  officialRecordId?: string | undefined;
};

export function searchOfficialEvents(query: string) {
  const value = norm(query.trim());
  return officialEvents.filter(
    (event) =>
      !value || norm(event.title).includes(value) || norm(event.venue ?? "").includes(value),
  );
}

export type FieldStatus = "same" | "different" | "missing";
export type VerifyStatus = "match" | "partial" | "need-info" | "unverified";

export type VerifyResult = {
  sourceName?: string;
  dateSource?: "official_poster";
  scheduleIssue?: string;
  sourceType?: "demo" | "official_public_data";
  sourceRows?: number[];
  ambiguous?: boolean;
  status: VerifyStatus;
  event?: ParkEvent;
  fields: {
    label: "행사명" | "날짜" | "장소";
    input: string;
    official: string;
    status: FieldStatus;
  }[];
};

const norm = (s: string) => s.toLowerCase().replace(/[\s·.\-_]/g, "");

export function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return d;
  const w = "일월화수목금토"[dt.getDay()];
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}(${w})`;
}

export function formatRange(e: ParkEvent) {
  return e.endDate && e.endDate !== e.startDate
    ? `${formatDate(e.startDate)} ~ ${formatDate(e.endDate).slice(5)}`
    : formatDate(e.startDate);
}

/** 홈 시설 필터와 무관하게 전체 샘플 데이터에서 대조합니다. */
export function verifyEvent(input: CheckInput): VerifyResult {
  const t = norm(input.title);
  // Do not select an arbitrary performance when several official records share a title.
  const byTitle = t ? officialEvents.filter((e) => norm(e.title) === t) : [];
  const selected = input.officialRecordId
    ? byTitle.find((event) => event.id === input.officialRecordId)
    : undefined;
  const official = selected ? [selected] : byTitle;
  if (official.length) {
    const record = official.length === 1 ? official[0] : undefined;
    const venue = record?.venue ?? "";
    const date = record?.startDate ?? "";
    const schedule = getOfficialSchedule(record?.id ?? "");
    const dates = schedule.dates.length ? schedule.dates : date ? [date] : [];
    const fields: VerifyResult["fields"] = [
      {
        label: "행사명",
        input: input.title,
        official: record?.title ?? input.title,
        status: "same",
      },
      {
        label: "날짜",
        input: input.date,
        official: schedule.raw || date,
        status:
          !dates.length || !input.date
            ? "missing"
            : dates.includes(input.date)
              ? "same"
              : "different",
      },
      {
        label: "장소",
        input: input.venue,
        official: venue,
        status:
          !venue || !input.venue.trim()
            ? "missing"
            : norm(venue) === norm(input.venue)
              ? "same"
              : "different",
      },
    ];
    return {
      sourceName: record ? officialRecordSource(record.id) : "공식 행사 자료",
      ...(schedule.raw
        ? { dateSource: "official_poster" as const, scheduleIssue: schedule.issue ?? "" }
        : {}),
      sourceType: "official_public_data",
      sourceRows: record?.sourceRows ?? [],
      ambiguous: official.length > 1,
      fields,
      status: fields.some((f) => f.status === "different")
        ? "partial"
        : fields.some((f) => f.status === "missing")
          ? "need-info"
          : "match",
    };
  }
  const event = t ? events.find((e) => norm(e.title) === t) : undefined;

  if (!event) {
    return {
      status: "unverified",
      fields: [
        { label: "행사명", input: input.title, official: "", status: "missing" },
        {
          label: "날짜",
          input: input.date ? formatDate(input.date) : "",
          official: "",
          status: "missing",
        },
        { label: "장소", input: input.venue, official: "", status: "missing" },
      ],
    };
  }

  const dateStatus: FieldStatus = !input.date
    ? "missing"
    : input.date >= event.startDate && input.date <= (event.endDate ?? event.startDate)
      ? "same"
      : "different";
  const venueStatus: FieldStatus = !input.venue.trim()
    ? "missing"
    : norm(event.venue).includes(norm(input.venue)) || norm(input.venue).includes(norm(event.venue))
      ? "same"
      : "different";

  const fields: VerifyResult["fields"] = [
    { label: "행사명", input: input.title, official: event.title, status: "same" },
    {
      label: "날짜",
      input: input.date ? formatDate(input.date) : "",
      official: formatRange(event),
      status: dateStatus,
    },
    { label: "장소", input: input.venue, official: event.venue, status: venueStatus },
  ];

  const status: VerifyStatus = fields.some((f) => f.status === "different")
    ? "partial"
    : fields.some((f) => f.status === "missing")
      ? "need-info"
      : "match";
  return { status, event, fields, sourceType: "demo" };
}

export const EXAMPLE_CASE: CheckInput = {
  title: "[시연용] 가상 별빛 콘서트",
  date: "2026-11-14",
  venue: "올림픽홀",
};
