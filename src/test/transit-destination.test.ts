import { describe, expect, it } from "vitest";
import { findTransitDestination } from "@/lib/transit-destination";

describe("행사 장소의 가는 길 연결", () => {
  it.each([
    ["평화의광장", "평화의 광장"],
    ["올림픽공원 평화의 광장", "평화의 광장"],
    ["올림픽체조경기장", "KSPO-DOME"],
    ["SK핸드볼경기장", "티켓링크 라이브 아레나"],
    ["88호수 수변무대", "수변무대"],
    ["뮤즈 라이브", "뮤즈라이브"],
  ])("%s을(를) %s에 연결한다", (venue, destination) => {
    expect(findTransitDestination(venue)?.name).toBe(destination);
  });

  it("지원하지 않거나 비어 있는 장소는 다른 공연장으로 연결하지 않는다", () => {
    expect(findTransitDestination("미사경정공원")).toBeUndefined();
    expect(findTransitDestination("")).toBeUndefined();
    expect(findTransitDestination("올림픽홀 주변")).toBeUndefined();
  });
});
