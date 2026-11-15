import { describe, expect, it } from "vitest";
import { buildHomeRankings, getMonthlyDemoEvents } from "@/routes/index";

describe("홈 행사와 랭킹", () => {
  it("현재 월과 겹치는 행사만 포스터 슬라이드에 사용한다", () => {
    const november = getMonthlyDemoEvents(new Date(2026, 10, 15));
    expect(november.map((event) => event.id)).toContain("autumn-concert");
    expect(november.map((event) => event.id)).not.toContain("kspo-winter");
  });

  it("담기 수로 행사와 장소 순위를 계산한다", () => {
    const rankings = buildHomeRankings({
      "autumn-concert": 8,
      "demo-concert-2026": 3,
    });
    expect(rankings.popular[0]?.id).toBe("autumn-concert");
    expect(rankings.venues[0]).toEqual({ venue: "88잔디마당", count: 8 });
  });
});
