import { describe, expect, it } from "vitest";
import { olympicParkVenueDestinations, transitGuides } from "@/data/transit";

describe("교통 안내 데이터", () => {
  it("모든 시설의 교통·주차 항목을 화면에서 읽을 수 있다", () => {
    for (const guide of transitGuides) {
      for (const mode of ["publicTransit", "car"] as const) {
        for (const item of guide[mode]) {
          expect(item, `${guide.anchor}: ${mode}`).toBeDefined();
          expect(item.title.trim()).not.toBe("");
          expect(item.detail.trim()).not.toBe("");
        }
      }
      expect(guide.car.some((item) => item.title === "행사일 혼잡 안내")).toBe(false);
    }
  });

  it("도착지 선택에는 올림픽공원 공연장만 표시한다", () => {
    expect(olympicParkVenueDestinations.map((destination) => destination.name)).toEqual([
      "KSPO-DOME",
      "티켓링크 라이브 아레나",
      "올림픽홀",
      "우리금융아트홀",
      "뮤즈라이브",
      "평화의 광장",
      "88마당",
      "만남의 광장",
      "수변무대",
      "한얼광장",
      "피크닉 광장",
    ]);

    for (const destination of olympicParkVenueDestinations) {
      expect(
        transitGuides.some(
          (guide) =>
            guide.anchor === destination.name || guide.aliases?.includes(destination.name),
        ),
        `${destination.name}의 교통 안내`,
      ).toBe(true);
    }
  });

  it("만남의 광장과 피크닉 광장은 각 장소의 개별 좌표를 사용한다", () => {
    const meeting = transitGuides.find((guide) => guide.anchor === "만남의 광장");
    const picnic = transitGuides.find((guide) => guide.anchor === "피크닉 광장");

    expect(meeting).toMatchObject({ latitude: 37.5169907, longitude: 127.1302628 });
    expect(picnic).toMatchObject({ latitude: 37.5205553754, longitude: 127.1150515712 });
    expect(meeting?.latitude).not.toBe(picnic?.latitude);
    expect(meeting?.longitude).not.toBe(picnic?.longitude);
  });
});
