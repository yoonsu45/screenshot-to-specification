import { describe, expect, it } from "vitest";
import { buildHomeRankings, getMonthlyDemoEvents } from "@/routes/index";
import { events } from "@/data/events";

describe("홈 행사와 랭킹", () => {
  it("CSV의 시연용 행사 20개를 사용한다", () => {
    expect(events).toHaveLength(20);
    expect(new Set(events.map((event) => event.id)).size).toBe(20);
    expect(events.every((event) => event.dataSource === "FICTIONAL_DEMO")).toBe(true);
    expect(events.at(-1)).toMatchObject({
      id: "OLP-DEMO-020",
      startDate: "2027-01-16",
      venue: "KSPO DOME",
    });
  });

  it("현재 월과 겹치는 행사만 포스터 슬라이드에 사용한다", () => {
    const november = getMonthlyDemoEvents(new Date(2026, 10, 15));
    expect(november.map((event) => event.id)).toContain("OLP-DEMO-001");
    expect(november.map((event) => event.id)).not.toContain("OLP-DEMO-006");
  });

  it("전체와 장소별 행사 순위를 담기 수로 계산한다", () => {
    const rankings = buildHomeRankings({
      "OLP-DEMO-005": 8,
      "OLP-DEMO-002": 3,
    });
    expect(rankings.popular[0]?.id).toBe("OLP-DEMO-005");
    expect(rankings.byVenue["88잔디마당"]?.[0]?.id).toBe("OLP-DEMO-005");
    expect(rankings.byVenue["올림픽홀"]?.[0]?.id).toBe("OLP-DEMO-002");
  });
});
