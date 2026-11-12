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
const PARK_ADDRESS = "서울 송파구 올림픽로 424";
const PARK_PUBLIC_TRANSIT = [
  { title: "올림픽공원역 3·4번 출구", detail: "5호선·9호선 이용" },
  { title: "몽촌토성역 1번 출구", detail: "8호선 · 평화의문 방면" },
];
const PARK_CAR = [
  { title: "올림픽공원 주차장", detail: "도착 시설과 가까운 주차장 이용" },
  { title: "행사일 혼잡 안내", detail: "대중교통 이용을 권장해요" },
];

export const transitGuides: TransitGuide[] = [
  {
    anchor: "올림픽홀",
    address: PARK_ADDRESS,
    latitude: 37.514747,
    longitude: 127.1275894,
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
    aliases: ["88잔디마당", "올림픽공원 산책로"],
    address: PARK_ADDRESS,
    latitude: 37.5207,
    longitude: 127.1215,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: [{ title: "주차장 P1", detail: "평화의문과 가까운 주차장" }, PARK_CAR[1]],
    officialUrl: PARK_GUIDE_URL,
  },
  {
    anchor: "미사경정공원",
    address: "경기 하남시 미사대로 505",
    latitude: 37.5600814,
    longitude: 127.20763,
    publicTransit: [
      { title: "하남풍산역 2번 출구", detail: "5호선 · 관리동까지 도보 약 15분" },
      { title: "미사역 2번 출구", detail: "10번 마을버스 · 나룰도서관 하차" },
    ],
    car: [
      { title: "미사경정공원 주차장", detail: "미사대로 505 공원 주차장 이용" },
      { title: "주말 혼잡 안내", detail: "행사일에는 진입이 지연될 수 있어요" },
    ],
    officialUrl: "https://www.ksponco.or.kr/online/misari/directns.do",
  },
  {
    anchor: "올림픽수영장",
    address: `${PARK_ADDRESS} 올림픽수영장`,
    latitude: 37.5209011,
    longitude: 127.1266415,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: PARK_CAR,
    officialUrl: "https://www.ksponco.or.kr/menu.es?mid=a50505000000",
  },
  {
    anchor: "올림픽공원스포츠센터",
    aliases: ["KSPO DOME"],
    address: `${PARK_ADDRESS} KSPO DOME`,
    latitude: 37.5192242,
    longitude: 127.1274696,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: PARK_CAR,
    officialUrl: "https://www.ksponco.or.kr/sports/menu.es?mid=a60505000000",
  },
  {
    anchor: "일산올림픽스포츠센터",
    aliases: ["일산 실내수영장", "일산 다목적실"],
    address: "경기 고양시 일산동구 중앙로 1182",
    latitude: 37.6526083,
    longitude: 126.77817,
    publicTransit: [
      { title: "마두역 6번 출구", detail: "지하철 3호선 · 지하통로 연결" },
      { title: "마두역 버스정류장", detail: "중앙로 경유 버스 이용" },
    ],
    car: [
      { title: "센터 지하주차장", detail: "지하 1층부터 지하 6층까지 이용" },
      { title: "주차 등록", detail: "이용 종목에 따라 무료 주차시간 확인" },
    ],
    officialUrl: "https://www.ksponco.or.kr/online/ilsan/directns.do",
  },
  {
    anchor: "분당올림픽스포츠센터",
    aliases: ["분당 로비 갤러리", "분당 운동장"],
    address: "경기 성남시 분당구 중앙공원로 35",
    latitude: 37.3806177,
    longitude: 127.1290905,
    publicTransit: [
      { title: "서현역 2번 출구 방향", detail: "수인분당선 · AK플라자 3번 출구에서 도보 약 10분" },
      { title: "마을버스 3·3-1·3-2", detail: "가까운 정류장에서 도보 약 3분" },
    ],
    car: [
      { title: "센터 지하주차장", detail: "지하주차장 이용" },
      { title: "주차 등록", detail: "이용 종목에 따라 무료 주차시간 확인" },
    ],
    officialUrl: "https://www.ksponco.or.kr/online/bundang/directns.do",
  },
  {
    anchor: "올림픽테니스장",
    address: `${PARK_ADDRESS} 실내테니스장`,
    latitude: 37.5145892,
    longitude: 127.1290598,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: PARK_CAR,
    officialUrl: "https://www.ksponco.or.kr/sports/",
  },
  {
    anchor: "올팍축구장",
    address: `${PARK_ADDRESS} 벨로드롬`,
    latitude: 37.5169,
    longitude: 127.1233338,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: PARK_CAR,
    officialUrl: "https://www.ksponco.or.kr/olympicpark/map?mid=a20102000000",
  },
  {
    anchor: "지샘터도서관",
    address: `${PARK_ADDRESS} 스포츠비즈홀 1층`,
    latitude: 37.5169,
    longitude: 127.1218,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: PARK_CAR,
    officialUrl: "https://www.ksponco.or.kr/lib/",
  },
  {
    anchor: "소마미술관",
    address: "서울 송파구 위례성대로 51",
    latitude: 37.5168386,
    longitude: 127.118065,
    publicTransit: PARK_PUBLIC_TRANSIT,
    car: [{ title: "주차장 P1", detail: "미술관과 가까운 주차장" }, PARK_CAR[1]],
    officialUrl: PARK_GUIDE_URL,
  },
  {
    anchor: "평화의광장",
    address: PARK_ADDRESS,
    latitude: 37.5175329,
    longitude: 127.11267,
    publicTransit: [{ title: "몽촌토성역 1번 출구", detail: "8호선 · 평화의문 바로 앞" }],
    car: [{ title: "주차장 P1", detail: "평화의광장과 가까운 주차장" }, PARK_CAR[1]],
    officialUrl: PARK_GUIDE_URL,
  },
];
