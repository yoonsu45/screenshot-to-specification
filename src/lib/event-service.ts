// 행사 조회와 대조 로직을 한곳에 모은 서비스 계층.
// 실제 API를 붙일 때는 이 파일의 함수 내부만 바꾸면 화면은 그대로 동작합니다.
import { events, type CategoryFilter, type ParkEvent } from "@/data/events";
import { ALL_FACILITIES_ID, getFacility } from "@/data/facilities";

export type ListResult =
  | { kind: "not-connected" }
  | { kind: "empty" }
  | { kind: "ok"; events: ParkEvent[] };

export function listEvents(facilityId: string, category: CategoryFilter): ListResult {
  const facility = getFacility(facilityId);
  if (!facility || !facility.connected) return { kind: "not-connected" };
  const scoped = facilityId === ALL_FACILITIES_ID ? events : events.filter((e) => e.facilityId === facilityId);
  const filtered = (category === "전체" ? scoped : scoped.filter((e) => e.category === category))
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return filtered.length ? { kind: "ok", events: filtered } : { kind: "empty" };
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export type CheckInput = { title: string; date: string; venue: string; image?: string };

export type FieldStatus = "same" | "different" | "missing";
export type VerifyStatus = "match" | "partial" | "need-info" | "unverified";

export type VerifyResult = {
  status: VerifyStatus;
  event?: ParkEvent;
  fields: { label: "행사명" | "날짜" | "장소"; input: string; official: string; status: FieldStatus }[];
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
  const event = t ? events.find((e) => norm(e.title).includes(t) || t.includes(norm(e.title))) : undefined;

  if (!event) {
    return {
      status: "unverified",
      fields: [
        { label: "행사명", input: input.title, official: "", status: "missing" },
        { label: "날짜", input: input.date ? formatDate(input.date) : "", official: "", status: "missing" },
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
    { label: "날짜", input: input.date ? formatDate(input.date) : "", official: formatRange(event), status: dateStatus },
    { label: "장소", input: input.venue, official: event.venue, status: venueStatus },
  ];

  const status: VerifyStatus = fields.some((f) => f.status === "different")
    ? "partial"
    : fields.some((f) => f.status === "missing")
      ? "need-info"
      : "match";
  return { status, event, fields };
}

export const DEMO_CASE: CheckInput = { title: "CRAVITY CONCERT", date: "2026-11-14", venue: "KSPO DOME" };
