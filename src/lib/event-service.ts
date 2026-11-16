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
  return officialEvents.filter(
    (event) => matchesEventSearch(event.title, event.venue ?? "", query),
  );
}

export function matchesEventSearch(title: string, venue: string, query: string) {
  const value = norm(query.trim());
  if (!value) return true;
  if (norm(title).includes(value) || norm(venue).includes(value)) return true;

  // 영문 행사명을 한글 발음으로 검색할 때 양쪽의 자음 소리를 비교한다.
  // 예: CRAVITY -> krbt, 크래비티 -> krbt
  if (!/^[가-힣\s]+$/.test(query.trim()) || !/[a-z]/i.test(title)) return false;
  const querySound = phoneticSkeleton(query);
  const englishTitle = title.replace(/[^a-z0-9]+/gi, " ");
  const titleSound = phoneticSkeleton(englishTitle);
  return (
    querySound.length >= 4 &&
    titleSound.length >= 4 &&
    titleSound.includes(querySound)
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

const norm = (s: string) => s.toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]/g, "");

const INITIAL_SOUNDS = [
  "k", "k", "n", "t", "t", "r", "m", "b", "b", "s", "s", "", "j", "j", "j", "k", "t", "b", "h",
] as const;
const FINAL_SOUNDS = [
  "", "k", "k", "k", "n", "n", "n", "t", "r", "k", "m", "b", "r", "r", "b", "r", "m", "b", "b", "t", "t", "ng", "t", "t", "k", "t", "b", "h",
] as const;

function phoneticSkeleton(value: string) {
  const lower = value.toLocaleLowerCase("ko-KR");
  let sound = "";

  for (let index = 0; index < lower.length; index += 1) {
    const character = lower[index]!;
    const code = character.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syllable = code - 0xac00;
      sound += INITIAL_SOUNDS[Math.floor(syllable / 588)] ?? "";
      sound += FINAL_SOUNDS[syllable % 28] ?? "";
      continue;
    }

    const pair = lower.slice(index, index + 2);
    const pairSound: Record<string, string> = {
      ch: "j",
      ck: "k",
      ng: "ng",
      ph: "b",
      qu: "k",
      sh: "s",
      th: "t",
    };
    if (pairSound[pair]) {
      sound += pairSound[pair];
      index += 1;
      continue;
    }

    if (character === "c") {
      sound += /[eiy]/.test(lower[index + 1] ?? "") ? "s" : "k";
      continue;
    }
    if (character === "g") {
      sound += /[eiy]/.test(lower[index + 1] ?? "") ? "j" : "k";
      continue;
    }

    const characterSound: Record<string, string> = {
      b: "b", d: "t", f: "b", h: "h", j: "j", k: "k", l: "r", m: "m", n: "n",
      p: "b", r: "r", s: "s", t: "t", v: "b", x: "ks", z: "s",
      "1": "n", "2": "t", "4": "br", "6": "sks", "8": "t",
    };
    sound += characterSound[character] ?? "";
  }

  return sound.replace(/(.)\1+/g, "$1");
}

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
  title: "[시연용] 2026 서울 윈터 사운드 페스타",
  date: "2026-11-21",
  venue: "KSPO DOME",
};
