import { describe, expect, it } from "vitest";
import posters from "@/data/official-posters.json";
import { getOfficialSchedule, parsePosterSchedule } from "@/lib/official-posters";
import { searchOfficialEvents, verifyEvent } from "@/lib/event-service";

describe("공식 포스터 개최일", () => {
  it("keeps separated sessions separate and expands explicit ranges", () => {
    expect(parsePosterSchedule("2012-03-16(금) / 2012-03-18(일)").dates).toEqual([
      "2012-03-16",
      "2012-03-18",
    ]);
    expect(parsePosterSchedule("2014-07-18(금) - 2014-07-20(일)").dates).toEqual([
      "2014-07-18",
      "2014-07-19",
      "2014-07-20",
    ]);
  });
  it("does not guess missing years or accept conflicting weekdays", () => {
    expect(parsePosterSchedule("3월 16일").dates).toEqual([]);
    expect(parsePosterSchedule("2012-03-16(토)").dates).toEqual([]);
    expect(parsePosterSchedule("2012-02-30").dates).toEqual([]);
  });
  it("applies six reviewed schedules and flags the cross-source discrepancy", () => {
    expect(
      posters.matches.filter((poster) => getOfficialSchedule(poster.eventId).dates.length),
    ).toHaveLength(6);
    const conflict = posters.matches.find((poster) => poster.posterId === "5874")!;
    expect(getOfficialSchedule(conflict.eventId).dates).toEqual([]);
    expect(getOfficialSchedule(conflict.eventId).issue).toContain("17일");
  });
  it("uses poster dates for comparison and names their source", () => {
    const poster = posters.matches.find((item) => item.posterId === "5836")!;
    const event = searchOfficialEvents("").find((item) => item.id === poster.eventId)!;
    const check = (date: string) =>
      verifyEvent({ title: event.title, venue: event.venue!, date, officialRecordId: event.id });
    expect(check("2019-10-26")).toMatchObject({ status: "match", dateSource: "official_poster" });
    expect(check("2019-10-27").status).toBe("match");
    expect(check("2019-10-28").status).toBe("partial");
  });
});
