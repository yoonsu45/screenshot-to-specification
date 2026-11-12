import walk from "@/assets/event-walk.jpg";
import exhibit from "@/assets/event-exhibit.jpg";
import family from "@/assets/event-family.jpg";

export const placeCategories = ["전체", "산책·사진", "카페·식사", "전시·문화"] as const;
export type PlaceCategory = Exclude<(typeof placeCategories)[number], "전체">;

export type NearbyPlace = {
  id: string;
  name: string;
  /** 기준이 되는 공연장/시설 이름 */
  anchor: string;
  category: PlaceCategory;
  walkMin: number;
  description: string;
  image: string;
};

export const nearbyPlaces: NearbyPlace[] = [
  { id: "rose-square", name: "장미광장", anchor: "올림픽홀", category: "산책·사진", walkMin: 5, description: "계절마다 꽃이 피는 사진 명소", image: walk },
  { id: "deulkkot", name: "들꽃마루", anchor: "올림픽홀", category: "산책·사진", walkMin: 8, description: "언덕 위 들꽃 산책길", image: walk },
  { id: "soma", name: "소마미술관", anchor: "올림픽홀", category: "전시·문화", walkMin: 4, description: "공원 안 현대미술관", image: exhibit },
  { id: "park-cafe", name: "공원 카페", anchor: "올림픽홀", category: "카페·식사", walkMin: 6, description: "공연 전 잠시 쉬어가기 좋은 곳", image: family },
  { id: "peace-gate", name: "평화의문", anchor: "올림픽공원", category: "산책·사진", walkMin: 10, description: "공원 대표 상징물", image: walk },
  { id: "museum-cafe", name: "미술관 카페", anchor: "올림픽공원", category: "카페·식사", walkMin: 7, description: "전시와 함께 즐기는 휴식", image: family },
];
