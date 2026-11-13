import { describe, expect, it } from "vitest";
import { transitGuides } from "@/data/transit";

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
});
