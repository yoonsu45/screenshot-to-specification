import { describe, expect, it } from "vitest";
import {
  getInternalFacilities,
  internalFacilityMapBounds,
  internalFacilityCategories,
} from "@/data/internal-facilities";

describe("올림픽공원 내부 시설", () => {
  it("장소 선택 대신 네 가지 시설 카테고리를 제공한다", () => {
    expect(internalFacilityCategories).toEqual(["카페", "편의점", "화장실", "기타"]);
    internalFacilityCategories.forEach((category) => {
      expect(getInternalFacilities(category).length).toBeGreaterThan(0);
    });
  });

  it("공연장과 관계없이 카테고리에 해당하는 편의시설만 보여준다", () => {
    expect(
      getInternalFacilities("편의점").every((facility) => facility.category === "편의점"),
    ).toBe(true);
  });

  it("공식 안내도에 표시된 공원 화장실 14곳을 모두 제공한다", () => {
    const restrooms = getInternalFacilities("화장실");
    expect(restrooms).toHaveLength(14);
    expect(restrooms.map((facility) => facility.name)).toEqual(
      Array.from({ length: 14 }, (_, index) => `공원 화장실 ${index + 1}`),
    );
  });

  it("모든 편의시설 좌표가 공원 지도 영역 안에 있다", () => {
    internalFacilityCategories.forEach((category) => {
      getInternalFacilities(category).forEach((facility) => {
        expect(facility.longitude).toBeGreaterThanOrEqual(internalFacilityMapBounds.west);
        expect(facility.longitude).toBeLessThanOrEqual(internalFacilityMapBounds.east);
        expect(facility.latitude).toBeGreaterThanOrEqual(internalFacilityMapBounds.south);
        expect(facility.latitude).toBeLessThanOrEqual(internalFacilityMapBounds.north);
      });
    });
  });

  it("모든 편의시설에 공식 안내도 핀 좌표가 있다", () => {
    internalFacilityCategories.forEach((category) => {
      getInternalFacilities(category).forEach((facility) => {
        expect(facility.mapX).toBeGreaterThanOrEqual(0);
        expect(facility.mapX).toBeLessThanOrEqual(953.04535);
        expect(facility.mapY).toBeGreaterThanOrEqual(0);
        expect(facility.mapY).toBeLessThanOrEqual(676.87866);
      });
    });
  });

  it("화장실 핀이 지도 가장자리 밖으로 잘리지 않는다", () => {
    getInternalFacilities("화장실").forEach((facility) => {
      expect(facility.mapX).toBeGreaterThanOrEqual(20);
      expect(facility.mapX).toBeLessThanOrEqual(953.04535 - 20);
      expect(facility.mapY).toBeGreaterThanOrEqual(20);
      expect(facility.mapY).toBeLessThanOrEqual(676.87866 - 20);
    });
  });
});
