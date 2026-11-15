import concert from "@/assets/event-concert.jpg";
import walk from "@/assets/event-walk.jpg";
import exhibit from "@/assets/event-exhibit.jpg";
import family from "@/assets/event-family.jpg";

export type EventCategory = "공연" | "스포츠" | "전시" | "체험" | "축제";
export const categories = ["전체", "공연", "스포츠", "전시", "체험", "축제"] as const;
export type CategoryFilter = (typeof categories)[number];

export type ParkEvent = {
  id: string;
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
  status?: string;
  dataSource?: "FICTIONAL_DEMO";
  image: string;
  officialUrl?: string;
  sourceType: "demo";
};

type DemoEventInput = Omit<ParkEvent, "title" | "image" | "sourceType"> & { title: string };

// 가상 데이터_20개.csv의 20개 행. 모든 행은 실제 행사가 아닌 시연용 가상 데이터입니다.
const demoEvents: DemoEventInput[] = [
  {
    id: "OLP-DEMO-001", title: "2026 서울 윈터 사운드 페스타", facilityId: "olympic-park", category: "공연",
    startDate: "2026-11-21", endDate: "2026-11-22", startTime: "18:00", endTime: "21:30",
    venue: "KSPO DOME", venueDetail: "올림픽공원 내 KSPO DOME", address: "서울특별시 송파구 올림픽로 424",
    description: "겨울의 시작을 알리는 대형 실내 라이브 음악 페스티벌", admission: "유료",
    posterFilename: "event_01.png", posterPath: "posters/event_01.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-002", title: "별빛 아래 인디나잇", facilityId: "olympic-park", category: "공연",
    startDate: "2026-11-27", endDate: "2026-11-27", startTime: "19:30", endTime: "22:00",
    venue: "올림픽홀", venueDetail: "올림픽공원 내 올림픽홀", address: "서울특별시 송파구 올림픽로 424",
    description: "독립 뮤지션들의 감성적인 밴드 라이브 무대", admission: "유료",
    posterFilename: "event_02.png", posterPath: "posters/event_02.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-003", title: "2026 핸드볼 드림 매치", facilityId: "olympic-park", category: "스포츠",
    startDate: "2026-11-28", endDate: "2026-11-29", startTime: "13:00", endTime: "18:00",
    venue: "SK핸드볼경기장", venueDetail: "올림픽공원 내 SK핸드볼경기장", address: "서울특별시 송파구 올림픽로 424",
    description: "청소년 유망주와 동호인이 함께하는 핸드볼 교류전", admission: "무료",
    posterFilename: "event_03.png", posterPath: "posters/event_03.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-004", title: "올팍 라이트 아트워크", facilityId: "olympic-park", category: "전시",
    startDate: "2026-11-25", endDate: "2026-12-13", startTime: "17:00", endTime: "21:00",
    venue: "평화의광장", venueDetail: "올림픽공원 내 평화의광장", address: "서울특별시 송파구 올림픽로 424",
    description: "빛과 그림자로 완성하는 야외 미디어아트 산책", admission: "무료",
    posterFilename: "event_04.png", posterPath: "posters/event_04.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-005", title: "어반 댄스 플레이그라운드", facilityId: "olympic-park", category: "체험",
    startDate: "2026-11-29", endDate: "2026-11-29", startTime: "11:00", endTime: "17:00",
    venue: "88잔디마당", venueDetail: "올림픽공원 내 88잔디마당", address: "서울특별시 송파구 올림픽로 424",
    description: "댄스 클래스와 오픈 배틀을 함께 즐기는 참여형 행사", admission: "무료",
    posterFilename: "event_05.png", posterPath: "posters/event_05.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-006", title: "재즈 온 더 파크", facilityId: "olympic-park", category: "공연",
    startDate: "2026-12-04", endDate: "2026-12-05", startTime: "19:00", endTime: "21:00",
    venue: "우리금융아트홀", venueDetail: "올림픽공원 내 우리금융아트홀", address: "서울특별시 송파구 올림픽로 424",
    description: "겨울밤에 어울리는 재즈 트리오와 보컬 무대", admission: "유료",
    posterFilename: "event_06.png", posterPath: "posters/event_06.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-007", title: "올림픽공원 크리스마스 마켓", facilityId: "olympic-park", category: "축제",
    startDate: "2026-12-05", endDate: "2026-12-20", startTime: "12:00", endTime: "20:00",
    venue: "평화의광장", venueDetail: "올림픽공원 내 평화의광장", address: "서울특별시 송파구 올림픽로 424",
    description: "수공예 소품과 겨울 간식이 모이는 연말 마켓", admission: "무료",
    posterFilename: "event_07.png", posterPath: "posters/event_07.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-008", title: "스노우 가든 포토 페스티벌", facilityId: "olympic-park", category: "전시",
    startDate: "2026-12-06", endDate: "2026-12-27", startTime: "10:00", endTime: "19:00",
    venue: "장미광장", venueDetail: "올림픽공원 내 장미광장", address: "서울특별시 송파구 올림픽로 424",
    description: "겨울 정원 조형물과 포토존을 즐기는 야외 전시", admission: "무료",
    posterFilename: "event_08.png", posterPath: "posters/event_08.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-009", title: "뮤지컬 갈라: 더 스테이지", facilityId: "olympic-park", category: "공연",
    startDate: "2026-12-11", endDate: "2026-12-12", startTime: "19:30", endTime: "21:30",
    venue: "올림픽홀", venueDetail: "올림픽공원 내 올림픽홀", address: "서울특별시 송파구 올림픽로 424",
    description: "인기 뮤지컬 넘버를 만나는 갈라 콘서트", admission: "유료",
    posterFilename: "event_09.png", posterPath: "posters/event_09.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-010", title: "2026 올팍 패밀리 스포츠데이", facilityId: "olympic-park", category: "스포츠",
    startDate: "2026-12-12", endDate: "2026-12-12", startTime: "10:00", endTime: "17:00",
    venue: "SK핸드볼경기장", venueDetail: "올림픽공원 내 SK핸드볼경기장", address: "서울특별시 송파구 올림픽로 424",
    description: "가족이 함께 즐기는 실내 스포츠 미션과 체험", admission: "무료",
    posterFilename: "event_10.png", posterPath: "posters/event_10.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-011", title: "윈터 클래식 앙상블", facilityId: "olympic-park", category: "공연",
    startDate: "2026-12-13", endDate: "2026-12-13", startTime: "17:00", endTime: "19:00",
    venue: "우리금융아트홀", venueDetail: "올림픽공원 내 우리금융아트홀", address: "서울특별시 송파구 올림픽로 424",
    description: "현악 앙상블이 들려주는 겨울 클래식 명곡", admission: "유료",
    posterFilename: "event_11.png", posterPath: "posters/event_11.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-012", title: "올팍 반려동물 산책학교", facilityId: "olympic-park", category: "체험",
    startDate: "2026-12-19", endDate: "2026-12-19", startTime: "10:00", endTime: "15:00",
    venue: "88잔디마당", venueDetail: "올림픽공원 내 88잔디마당", address: "서울특별시 송파구 올림픽로 424",
    description: "반려견과 함께 배우는 산책 예절과 안전 수칙", admission: "사전신청",
    posterFilename: "event_12.png", posterPath: "posters/event_12.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-013", title: "2026 K-POP 카운트다운 라이브", facilityId: "olympic-park", category: "공연",
    startDate: "2026-12-24", endDate: "2026-12-24", startTime: "18:30", endTime: "22:00",
    venue: "KSPO DOME", venueDetail: "올림픽공원 내 KSPO DOME", address: "서울특별시 송파구 올림픽로 424",
    description: "연말을 장식하는 퍼포먼스 중심의 K-POP 콘서트", admission: "유료",
    posterFilename: "event_13.png", posterPath: "posters/event_13.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-014", title: "크리스마스 오케스트라 나이트", facilityId: "olympic-park", category: "공연",
    startDate: "2026-12-25", endDate: "2026-12-25", startTime: "18:00", endTime: "20:00",
    venue: "올림픽홀", venueDetail: "올림픽공원 내 올림픽홀", address: "서울특별시 송파구 올림픽로 424",
    description: "캐럴과 영화음악으로 채우는 크리스마스 공연", admission: "유료",
    posterFilename: "event_14.png", posterPath: "posters/event_14.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-015", title: "빛의 산책: 미드나잇 가든", facilityId: "olympic-park", category: "전시",
    startDate: "2026-12-26", endDate: "2027-01-10", startTime: "17:30", endTime: "21:00",
    venue: "몽촌토성 산책로", venueDetail: "올림픽공원 내 몽촌토성 산책로", address: "서울특별시 송파구 올림픽로 424",
    description: "산책 동선을 따라 만나는 가상의 야간 조명 전시", admission: "무료",
    posterFilename: "event_15.png", posterPath: "posters/event_15.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-016", title: "새해 소망 캘리그래피 공방", facilityId: "olympic-park", category: "체험",
    startDate: "2026-12-27", endDate: "2026-12-27", startTime: "11:00", endTime: "17:00",
    venue: "만남의광장", venueDetail: "올림픽공원 내 만남의광장", address: "서울특별시 송파구 올림픽로 424",
    description: "새해 문구를 직접 쓰고 엽서를 제작하는 체험", admission: "사전신청",
    posterFilename: "event_16.png", posterPath: "posters/event_16.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-017", title: "굿바이 2026 올팍 페스티벌", facilityId: "olympic-park", category: "축제",
    startDate: "2026-12-31", endDate: "2026-12-31", startTime: "18:00", endTime: "23:00",
    venue: "평화의광장", venueDetail: "올림픽공원 내 평화의광장", address: "서울특별시 송파구 올림픽로 424",
    description: "한 해를 마무리하는 음악과 참여 프로그램", admission: "무료",
    posterFilename: "event_17.png", posterPath: "posters/event_17.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-018", title: "2027 뉴이어 러닝 챌린지", facilityId: "olympic-park", category: "스포츠",
    startDate: "2027-01-02", endDate: "2027-01-02", startTime: "08:00", endTime: "12:00",
    venue: "88잔디마당", venueDetail: "올림픽공원 내 88잔디마당", address: "서울특별시 송파구 올림픽로 424",
    description: "새해 첫 주말에 즐기는 비경쟁 러닝 이벤트", admission: "사전신청",
    posterFilename: "event_18.png", posterPath: "posters/event_18.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-019", title: "키즈 사이언스 플레이랩", facilityId: "olympic-park", category: "체험",
    startDate: "2027-01-09", endDate: "2027-01-10", startTime: "10:00", endTime: "17:00",
    venue: "한성백제박물관 인근 야외공간", venueDetail: "올림픽공원 내 한성백제박물관 인근 야외공간", address: "서울특별시 송파구 올림픽로 424",
    description: "어린이와 보호자가 함께하는 과학 놀이 체험", admission: "사전신청",
    posterFilename: "event_19.png", posterPath: "posters/event_19.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
  {
    id: "OLP-DEMO-020", title: "2027 희망의 첫 무대", facilityId: "olympic-park", category: "공연",
    startDate: "2027-01-16", endDate: "2027-01-16", startTime: "18:00", endTime: "20:30",
    venue: "KSPO DOME", venueDetail: "올림픽공원 내 KSPO DOME", address: "서울특별시 송파구 올림픽로 424",
    description: "새해의 시작을 기념하는 장르 융합 콘서트", admission: "유료",
    posterFilename: "event_20.png", posterPath: "posters/event_20.png", dataSource: "FICTIONAL_DEMO", status: "예정",
  },
];

const categoryImages: Record<EventCategory, string> = {
  공연: concert,
  스포츠: walk,
  전시: exhibit,
  체험: family,
  축제: concert,
};

export const events: ParkEvent[] = demoEvents.map((event) => ({
  ...event,
  title: `[시연용] ${event.title}`,
  image: categoryImages[event.category],
  sourceType: "demo",
}));
