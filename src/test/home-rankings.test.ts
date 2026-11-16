import { describe, expect, it } from "vitest";
import { buildHomeRankings, getMonthlyDemoEvents } from "@/routes/index";
import { events } from "@/data/events";

describe("홈 행사와 랭킹", () => {
  it("CSV의 행사 30개와 포스터 경로를 사용한다", () => {
    expect(events).toHaveLength(30);
    expect(new Set(events.map((event) => event.id)).size).toBe(30);
    expect(new Set(events.map((event) => event.posterFilename)).size).toBe(30);
    expect(events.every((event) => event.dataSource?.includes("시연용 가상 데이터"))).toBe(true);
    expect(events.every((event) => event.image === event.posterPath)).toBe(true);
    expect(events.at(-1)).toMatchObject({
      id: "OLP-DEMO-030",
      sourceId: "OP-DEMO-030",
      startDate: "2027-01-31",
      venue: "KSPO-DOME",
      posterFilename: "event_30.jpg",
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
    expect(rankings.byVenue["88마당"]?.[0]?.id).toBe("OLP-DEMO-005");
    expect(rankings.byVenue["올림픽홀"]?.[0]?.id).toBe("OLP-DEMO-002");
  });
});
