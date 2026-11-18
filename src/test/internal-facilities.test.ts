import { describe, expect, it } from "vitest";
import {
  getInternalFacilities,
  getInternalVenueProfile,
  internalFacilityMapBounds,
  internalFacilityCategories,
} from "@/data/internal-facilities";

describe("올림픽공원 내부 시설", () => {
  it("장소 선택 대신 네 가지 시설 카테고리를 제공한다", () => {
    expect(internalFacilityCategories).toEqual(["카페", "편의점", "화장실", "기타"]);
    internalFacilityCategories.forEach((category) => {
      expect(getInternalFacilities(category, "KSPO DOME").length).toBeGreaterThan(0);
    });
  });

  it("선택한 공연장의 별칭을 내부 지도 핀에 연결한다", () => {
    expect(getInternalVenueProfile("체조경기장").name).toBe("KSPO DOME");
    expect(getInternalVenueProfile("핸드볼경기장").name).toBe("티켓링크 라이브 아레나");
  });

  it("선택한 공연장이 없거나 알 수 없으면 KSPO DOME을 먼저 보여준다", () => {
    expect(getInternalVenueProfile(null).name).toBe("KSPO DOME");
    expect(getInternalVenueProfile("등록되지 않은 장소").name).toBe("KSPO DOME");
  });

  it("현재 공연장과 가까운 시설을 목록 위에 배치한다", () => {
    const stores = getInternalFacilities("편의점", "KSPO DOME");
    expect(stores[0]?.near).toContain("KSPO DOME");
  });

  it("모든 편의시설 좌표가 공원 지도 영역 안에 있다", () => {
    internalFacilityCategories.forEach((category) => {
      getInternalFacilities(category, "KSPO DOME").forEach((facility) => {
        expect(facility.longitude).toBeGreaterThanOrEqual(internalFacilityMapBounds.west);
        expect(facility.longitude).toBeLessThanOrEqual(internalFacilityMapBounds.east);
        expect(facility.latitude).toBeGreaterThanOrEqual(internalFacilityMapBounds.south);
        expect(facility.latitude).toBeLessThanOrEqual(internalFacilityMapBounds.north);
      });
    });
  });
});
