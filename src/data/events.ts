import concert from "@/assets/event-concert.jpg";
import walk from "@/assets/event-walk.jpg";
import exhibit from "@/assets/event-exhibit.jpg";
import family from "@/assets/event-family.jpg";

export type EventCategory = "공연" | "체험" | "전시" | "프로그램";
export const categories = ["전체", "공연", "체험", "전시", "프로그램"] as const;
export type CategoryFilter = (typeof categories)[number];

export type ParkEvent = {
  id: string;
  title: string;
  /** 상위 시설 ID (facilities.ts) */
  facilityId: string;
  /** 세부 공연장/장소 (예: KSPO DOME, 올림픽홀) */
  venue: string;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  image: string;
  officialUrl?: string;
  sourceType: "demo";
};

// All schedules here are fictional examples, separate from the official API snapshot.
const demoEvents = [
  { id: "demo-concert-2026", title: "가상 별빛 콘서트", facilityId: "olympic-park", venue: "올림픽홀", category: "공연", startDate: "2026-11-14", endDate: "2026-11-15", image: concert },
  { id: "autumn-concert", title: "가을 음악회", facilityId: "olympic-park", venue: "88잔디마당", category: "공연", startDate: "2026-11-12", image: concert },
  { id: "park-walk", title: "공원 산책 프로그램", facilityId: "olympic-park", venue: "올림픽공원 산책로", category: "프로그램", startDate: "2026-11-13", endDate: "2026-11-27", image: walk },
  { id: "weekend-exhibit", title: "주말 전시", facilityId: "olympic-park", venue: "소마미술관", category: "전시", startDate: "2026-11-21", endDate: "2026-11-22", image: exhibit },
  { id: "family-fest", title: "가족 체험 축제", facilityId: "olympic-park", venue: "평화의광장", category: "체험", startDate: "2026-11-28", image: family },
  { id: "kspo-winter", title: "윈터 페스타 라이브", facilityId: "olympic-park", venue: "KSPO DOME", category: "공연", startDate: "2026-12-05", image: concert },
  { id: "ilsan-swim", title: "어린이 생존수영 체험", facilityId: "ilsan", venue: "일산 실내수영장", category: "체험", startDate: "2026-11-16", image: family },
  { id: "ilsan-yoga", title: "주말 요가 클래스", facilityId: "ilsan", venue: "일산 다목적실", category: "프로그램", startDate: "2026-11-22", endDate: "2026-12-20", image: walk },
  { id: "bundang-photo", title: "생활체육 사진전", facilityId: "bundang", venue: "분당 로비 갤러리", category: "전시", startDate: "2026-11-18", endDate: "2026-11-30", image: exhibit },
  { id: "bundang-run", title: "가족 달리기 교실", facilityId: "bundang", venue: "분당 운동장", category: "체험", startDate: "2026-11-29", image: family },
];

export const events: ParkEvent[] = demoEvents.map((event) => ({
  ...event,
  category: event.category as EventCategory,
  title: `[시연용] ${event.title}`,
  sourceType: "demo",
}));
