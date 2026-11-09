// 시설 목록. 새 시설은 이 배열에 추가하면 홈 필터와 선택창에 바로 나타납니다.
export type Facility = {
  id: string;
  name: string;
  /** 검색용 별칭 (예: 지역명) */
  keywords?: string[];
  /** 공개 일정 데이터가 연결되어 있는지 */
  connected: boolean;
};

export const ALL_FACILITIES_ID = "all";

export const facilities: Facility[] = [
  { id: ALL_FACILITIES_ID, name: "전체 시설", connected: true },
  { id: "olympic-park", name: "올림픽공원", keywords: ["송파", "올팍", "KSPO DOME", "올림픽홀"], connected: true },
  { id: "misa", name: "미사경정공원", keywords: ["하남", "미사"], connected: false },
  { id: "olympic-pool", name: "올림픽수영장", keywords: ["수영"], connected: false },
  { id: "op-sports", name: "올림픽공원스포츠센터", keywords: ["송파"], connected: false },
  { id: "ilsan", name: "일산올림픽스포츠센터", keywords: ["일산", "고양"], connected: true },
  { id: "bundang", name: "분당올림픽스포츠센터", keywords: ["분당", "성남"], connected: true },
  { id: "tennis", name: "올림픽테니스장", keywords: ["테니스"], connected: false },
  { id: "football", name: "올팍축구장", keywords: ["축구"], connected: true },
  { id: "jisaemteo", name: "지샘터도서관", keywords: ["도서관"], connected: false },
];

export function getFacility(id: string) {
  return facilities.find((f) => f.id === id);
}

export function searchFacilities(query: string) {
  const q = query.trim().toLowerCase();
  const rest = facilities.filter((f) => f.id !== ALL_FACILITIES_ID);
  const all = facilities.find((f) => f.id === ALL_FACILITIES_ID)!;
  if (!q) return [all, ...rest];
  const hit = rest.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.keywords?.some((k) => k.toLowerCase().includes(q)),
  );
  return [all, ...hit];
}
