import { ALL_FACILITIES_ID, getFacility } from "@/data/facilities";

/** 주변·가는 길 기준: 대조로 확인된 공연장 > 선택된 시설 */
export function resolveAnchor(anchor: string | null, facilityId: string) {
  if (anchor) return anchor;
  if (facilityId === ALL_FACILITIES_ID) return "올림픽공원";
  return getFacility(facilityId)?.name ?? "올림픽공원";
}
