export type TransitGuide = {
  anchor: string;
  aliases?: string[];
  address: string;
  latitude: number;
  longitude: number;
  publicTransit: { title: string; detail: string }[];
  car: { title: string; detail: string }[];
  officialUrl: string;
};

const PARK_GUIDE_URL = "https://www.ksponco.or.kr/olympicpark/";

export const transitGuides: TransitGuide[] = [
  {
    anchor: "올림픽홀",
    address: "서울 송파구 올림픽로 424",
    latitude: 37.5148,
    longitude: 127.1276,
    publicTransit: [
      { title: "올림픽공원역 3번 출구", detail: "5호선·9호선 · 도보 약 7분" },
      { title: "버스 정류장 올림픽공원", detail: "간선·지선 버스 이용" },
    ],
    car: [
      { title: "가까운 주차장 P2", detail: "올림픽홀과 가장 가까운 주차장" },
      { title: "대체 주차장 P1", detail: "행사 당일 혼잡 시 이용" },
    ],
    officialUrl: PARK_GUIDE_URL,
  },
  {
    anchor: "올림픽공원",
    aliases: ["88잔디마당", "올림픽공원 산책로", "소마미술관", "평화의광장", "KSPO DOME"],
    address: "서울 송파구 올림픽로 424",
    latitude: 37.5207,
    longitude: 127.1215,
    publicTransit: [{ title: "몽촌토성역 1번 출구", detail: "8호선 · 평화의문 방면" }],
    car: [{ title: "주차장 P1", detail: "평화의문 인근" }],
    officialUrl: PARK_GUIDE_URL,
  },
];
