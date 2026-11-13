import { describe, expect, it } from "vitest";
import { getParkingEventNotices, toKoreaDateKey } from "@/lib/parking-guidance";

describe("행사 일정 기반 주차 안내", () => {
  it("도착 장소의 오늘과 가까운 행사만 반환한다", () => {
    const notices = getParkingEventNotices("올림픽홀", [], "2026-11-14");

    expect(notices.map((notice) => notice.event.id)).toEqual(["demo-concert-2026"]);
    expect(notices[0]).toMatchObject({ daysUntil: 0, isActiveToday: true });
  });

  it("공원 전체를 선택하면 올림픽공원 내 일정을 함께 보여준다", () => {
    const notices = getParkingEventNotices("올림픽공원", [], "2026-11-13", 2);

    expect(notices.map((notice) => notice.event.id)).toEqual(["park-walk", "demo-concert-2026"]);
  });

  it("시설 별칭에 해당하는 행사도 찾는다", () => {
    const notices = getParkingEventNotices(
      "일산올림픽스포츠센터",
      ["일산 실내수영장", "일산 다목적실"],
      "2026-11-15",
    );

    expect(notices[0]?.event.id).toBe("ilsan-swim");
    expect(notices[0]?.daysUntil).toBe(1);
  });

  it("배포 서버의 시간대와 관계없이 한국 날짜를 사용한다", () => {
    expect(toKoreaDateKey(new Date("2026-11-13T16:00:00Z"))).toBe("2026-11-14");
  });
});
