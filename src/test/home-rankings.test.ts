import { describe, expect, it } from "vitest";
import { buildHomeRankings, getMonthlyDemoEvents } from "@/routes/index";

describe("홈 행사와 랭킹", () => {
  it("현재 월과 겹치는 행사만 포스터 슬라이드에 사용한다", () => {
    const november = getMonthlyDemoEvents(new Date(2026, 10, 15));
    expect(november.map((event) => event.id)).toContain("autumn-concert");
    expect(november.map((event) => event.id)).not.toContain("kspo-winter");
  });

  it("전체와 장소별 행사 순위를 담기 수로 계산한다", () => {
    const rankings = buildHomeRankings({
      "autumn-concert": 8,
      "demo-concert-2026": 3,
    });
    expect(rankings.popular[0]?.id).toBe("autumn-concert");
    expect(rankings.byVenue["88잔디마당"]?.[0]?.id).toBe("autumn-concert");
    expect(rankings.byVenue["올림픽홀"]?.[0]?.id).toBe("demo-concert-2026");
  });
});
