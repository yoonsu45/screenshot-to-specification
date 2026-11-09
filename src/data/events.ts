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
  /** 샘플 데이터 표시 */
  demo: true;
};

export const events: ParkEvent[] = [
  { id: "cravity-2026", title: "CRAVITY CONCERT", facilityId: "olympic-park", venue: "올림픽홀", category: "공연", startDate: "2026-11-14", endDate: "2026-11-15", image: concert, officialUrl: "https://www.ksponco.or.kr/olympicpark/eventInfo/eventInfoView.es?evtSeq=5167&mid=a20301010200", demo: true },
  { id: "autumn-concert", title: "가을 음악회", facilityId: "olympic-park", venue: "88잔디마당", category: "공연", startDate: "2026-11-12", image: concert, demo: true },
  { id: "park-walk", title: "공원 산책 프로그램", facilityId: "olympic-park", venue: "올림픽공원 산책로", category: "프로그램", startDate: "2026-11-13", endDate: "2026-11-27", image: walk, demo: true },
  { id: "weekend-exhibit", title: "주말 전시", facilityId: "olympic-park", venue: "소마미술관", category: "전시", startDate: "2026-11-21", endDate: "2026-11-22", image: exhibit, demo: true },
  { id: "family-fest", title: "가족 체험 축제", facilityId: "olympic-park", venue: "평화의광장", category: "체험", startDate: "2026-11-28", image: family, demo: true },
  { id: "kspo-winter", title: "윈터 페스타 라이브", facilityId: "olympic-park", venue: "KSPO DOME", category: "공연", startDate: "2026-12-05", image: concert, demo: true },
  { id: "ilsan-swim", title: "어린이 생존수영 체험", facilityId: "ilsan", venue: "일산 실내수영장", category: "체험", startDate: "2026-11-16", image: family, demo: true },
  { id: "ilsan-yoga", title: "주말 요가 클래스", facilityId: "ilsan", venue: "일산 다목적실", category: "프로그램", startDate: "2026-11-22", endDate: "2026-12-20", image: walk, demo: true },
  { id: "bundang-photo", title: "생활체육 사진전", facilityId: "bundang", venue: "분당 로비 갤러리", category: "전시", startDate: "2026-11-18", endDate: "2026-11-30", image: exhibit, demo: true },
  { id: "bundang-run", title: "가족 달리기 교실", facilityId: "bundang", venue: "분당 운동장", category: "체험", startDate: "2026-11-29", image: family, demo: true },
];
