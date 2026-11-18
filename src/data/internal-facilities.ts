export const internalFacilityCategories = ["카페", "편의점", "화장실", "기타"] as const;
export type InternalFacilityCategory = (typeof internalFacilityCategories)[number];

export type InternalFacility = {
  id: string;
  name: string;
  category: InternalFacilityCategory;
  location: string;
  detail: string;
  near: string[];
  latitude: number;
  longitude: number;
};

export const internalFacilityMapBounds = {
  north: 37.5235,
  south: 37.5125,
  east: 127.1325,
  west: 127.11,
} as const;

export type InternalVenueProfile = {
  name: string;
  aliases: string[];
  address: string;
  nearestEntrance: string;
  latitude: number;
  longitude: number;
};

export const OFFICIAL_PARK_MAP_PDF_URL =
  "https://www.ksponco.or.kr/olympicpark/map/img/olpark/%EC%98%AC%EB%A6%BC%ED%94%BD%EA%B3%B5%EC%9B%90_%EC%A2%85%ED%95%A9%EC%95%88%EB%82%B4%EB%8F%84.pdf";

export const internalVenueProfiles: InternalVenueProfile[] = [
  {
    name: "KSPO DOME",
    aliases: ["KSPO-DOME", "KSPO DOME", "체조경기장", "올림픽체조경기장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문",
    latitude: 37.5192479,
    longitude: 127.1277213,
  },
  {
    name: "티켓링크 라이브 아레나",
    aliases: ["티켓링크 라이브 아레나", "핸드볼경기장", "SK핸드볼경기장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문·남2문",
    latitude: 37.5173464,
    longitude: 127.1259922,
  },
  {
    name: "우리금융아트홀",
    aliases: ["우리금융아트홀", "올림픽역도경기장", "역도경기장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "남2문",
    latitude: 37.5166404,
    longitude: 127.124542,
  },
  {
    name: "올림픽홀",
    aliases: ["올림픽홀"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문",
    latitude: 37.514747,
    longitude: 127.1275894,
  },
  {
    name: "뮤즈라이브",
    aliases: ["뮤즈라이브", "뮤즈 라이브"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문",
    latitude: 37.514747,
    longitude: 127.1275894,
  },
  {
    name: "한얼광장",
    aliases: ["한얼광장", "올림픽공원 한얼광장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문·남2문",
    latitude: 37.5177366,
    longitude: 127.1271594,
  },
  {
    name: "88마당",
    aliases: ["88마당", "88잔디마당"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문",
    latitude: 37.5186737,
    longitude: 127.1240372,
  },
  {
    name: "만남의 광장",
    aliases: ["만남의 광장", "만남의광장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "동2문·올림픽공원역",
    latitude: 37.5169907,
    longitude: 127.1302628,
  },
  {
    name: "피크닉 광장",
    aliases: ["피크닉 광장", "피크닉광장", "피크닉장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "북1문·북2문",
    latitude: 37.5205554,
    longitude: 127.1150516,
  },
  {
    name: "수변무대",
    aliases: ["수변무대", "88호수 수변무대", "88호수수변무대"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "북2문",
    latitude: 37.5202995,
    longitude: 127.1236663,
  },
  {
    name: "평화의 광장",
    aliases: ["평화의 광장", "평화의광장"],
    address: "서울특별시 송파구 올림픽로 424 올림픽공원 내부",
    nearestEntrance: "서1문·남4문",
    latitude: 37.5175329,
    longitude: 127.11267,
  },
];

export function getInternalVenueProfile(anchor: string | null | undefined) {
  const normalized = anchor?.trim().toLocaleLowerCase("ko-KR") ?? "";
  return (
    internalVenueProfiles.find((profile) =>
      [profile.name, ...profile.aliases].some(
        (name) => name.toLocaleLowerCase("ko-KR") === normalized,
      ),
    ) ?? internalVenueProfiles[0]!
  );
}

export const internalFacilities: InternalFacility[] = [
  {
    id: "cafe-olympic-hall",
    name: "올림픽홀 카페",
    category: "카페",
    location: "올림픽홀 내부 · 장미광장 인근",
    detail: "공연 일정에 따라 운영시간이 달라질 수 있어요.",
    near: ["올림픽홀", "뮤즈라이브"],
    latitude: 37.514747,
    longitude: 127.1275894,
  },
  {
    id: "cafe-woori",
    name: "우리금융아트홀 카페",
    category: "카페",
    location: "우리금융아트홀 내부",
    detail: "공연시간에 맞춰 탄력적으로 운영해요.",
    near: ["우리금융아트홀"],
    latitude: 37.5166404,
    longitude: 127.124542,
  },
  {
    id: "cafe-one-shot",
    name: "#1 SHOT IN COFFEE",
    category: "카페",
    location: "올림픽수영장 1층",
    detail: "커피·음료와 간단한 베이커리를 판매해요.",
    near: ["KSPO DOME", "피크닉 광장", "수변무대"],
    latitude: 37.5209011,
    longitude: 127.1266415,
  },
  {
    id: "cafe-twosome-meeting",
    name: "투썸플레이스 만남의광장점",
    category: "카페",
    location: "만남의 광장 · 올림픽공원역 방면",
    detail: "올림픽공원역에서 공연장으로 이동할 때 들르기 좋아요.",
    near: ["만남의 광장", "티켓링크 라이브 아레나", "한얼광장"],
    latitude: 37.5169907,
    longitude: 127.1302628,
  },
  {
    id: "cafe-pascucci",
    name: "파스쿠찌 올림픽공원점",
    category: "카페",
    location: "소마미술관 2층",
    detail: "남3문과 소마미술관 방면 카페예요.",
    near: ["평화의 광장"],
    latitude: 37.5168386,
    longitude: 127.118065,
  },
  {
    id: "store-main",
    name: "올림픽공원 매점 본점",
    category: "편의점",
    location: "티켓링크 라이브 아레나 2-1문 앞",
    detail: "라면·생수·간식 등을 판매해요.",
    near: ["티켓링크 라이브 아레나", "한얼광장", "88마당"],
    latitude: 37.5173464,
    longitude: 127.1259922,
  },
  {
    id: "store-cu",
    name: "CU 올림픽공원점",
    category: "편의점",
    location: "만남의 광장 · 올림픽공원역 4번 출구 방면",
    detail: "도시락·음료·간식 등을 판매해요.",
    near: ["만남의 광장", "올림픽홀", "뮤즈라이브"],
    latitude: 37.5169907,
    longitude: 127.1302628,
  },
  {
    id: "store-gs25",
    name: "GS25 올림픽수영장점",
    category: "편의점",
    location: "올림픽수영장 1층",
    detail: "북2문과 KSPO DOME 방면에서 이용하기 좋아요.",
    near: ["KSPO DOME", "피크닉 광장", "수변무대"],
    latitude: 37.5209011,
    longitude: 127.1266415,
  },
  {
    id: "store-dome",
    name: "KSPO DOME 내부 매점",
    category: "편의점",
    location: "KSPO DOME 2층 내부",
    detail: "공연·행사 일정에 따라 탄력적으로 운영해요.",
    near: ["KSPO DOME"],
    latitude: 37.5192479,
    longitude: 127.1277213,
  },
  {
    id: "restroom-dome",
    name: "KSPO DOME 화장실",
    category: "화장실",
    location: "KSPO DOME 내부",
    detail: "입장 가능 구역은 행사 운영 동선에 따라 달라져요.",
    near: ["KSPO DOME"],
    latitude: 37.5192479,
    longitude: 127.1277213,
  },
  {
    id: "restroom-arena",
    name: "티켓링크 라이브 아레나 화장실",
    category: "화장실",
    location: "티켓링크 라이브 아레나 내부",
    detail: "공연장 입장 후 층별 안내를 확인해 주세요.",
    near: ["티켓링크 라이브 아레나"],
    latitude: 37.5173464,
    longitude: 127.1259922,
  },
  {
    id: "restroom-hall",
    name: "올림픽홀 화장실",
    category: "화장실",
    location: "올림픽홀 내부",
    detail: "공연장 입장 후 층별 안내를 확인해 주세요.",
    near: ["올림픽홀", "뮤즈라이브"],
    latitude: 37.514747,
    longitude: 127.1275894,
  },
  {
    id: "info-peace",
    name: "안내센터 1 · 수유실",
    category: "기타",
    location: "평화의 광장",
    detail: "공원 안내와 수유실을 이용할 수 있어요.",
    near: ["평화의 광장"],
    latitude: 37.5175329,
    longitude: 127.11267,
  },
  {
    id: "info-meeting",
    name: "안내센터 2",
    category: "기타",
    location: "만남의 광장",
    detail: "공원 내부 위치와 이동 동선을 문의할 수 있어요.",
    near: ["만남의 광장"],
    latitude: 37.5169907,
    longitude: 127.1302628,
  },
  {
    id: "ticket-box",
    name: "해피박스 · 티켓박스",
    category: "기타",
    location: "우리금융아트홀 앞·KSPO DOME 방면",
    detail: "행사별 운영 여부를 현장에서 확인해 주세요.",
    near: ["우리금융아트홀", "KSPO DOME", "88마당"],
    latitude: 37.5168,
    longitude: 127.1248,
  },
];

export function getInternalFacilities(category: InternalFacilityCategory, venueName: string) {
  return internalFacilities
    .filter((facility) => facility.category === category)
    .sort((a, b) => Number(b.near.includes(venueName)) - Number(a.near.includes(venueName)));
}

export function getInternalFacilityMapPosition(facility: InternalFacility) {
  const { north, south, east, west } = internalFacilityMapBounds;
  return {
    left: ((facility.longitude - west) / (east - west)) * 100,
    top: ((north - facility.latitude) / (north - south)) * 100,
  };
}
