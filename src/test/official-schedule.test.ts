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
      ["5987", "5994", "5977", "5906", "5850", "5836"].every((id) => {
        const poster = posters.matches.find((item) => item.posterId === id)!;
        return getOfficialSchedule(poster.eventId).dates.length > 0;
      }),
    ).toBe(true);
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
  it("keeps captured values separate from the explicitly selected official record", () => {
    const poster = posters.matches.find((item) => item.posterId === "5836")!;
    const event = searchOfficialEvents("").find((item) => item.id === poster.eventId)!;
    const result = verifyEvent({ title: "캡처에 적힌 다른 공연명", date: "2019-10-28", venue: "다른 공연장", officialRecordId: event.id });
    expect(result.status).toBe("partial");
    expect(result.fields).toEqual([
      expect.objectContaining({ label: "행사명", input: "캡처에 적힌 다른 공연명", official: event.title, status: "different" }),
      expect.objectContaining({ label: "날짜", input: "2019-10-28", status: "different" }),
      expect.objectContaining({ label: "장소", input: "다른 공연장", official: event.venue, status: "different" }),
    ]);
  });
  it("recognizes verified aliases for the same venue", () => {
    const event = searchOfficialEvents("").find((item) => item.venue === "KSPO DOME")!;
    const result = verifyEvent({ title: event.title, venue: "올림픽체조경기장", date: "", officialRecordId: event.id });
    expect(result.fields.find((field) => field.label === "장소")?.status).toBe("same");
  });
  it("compares both endpoints of an explicitly continuous official period", () => {
    const event = searchOfficialEvents("").find((item) => {
      const schedule = getOfficialSchedule(item.id);
      return schedule.dates.length > 2 && /^\d{4}-/.test(schedule.raw) && /\s-\s/.test(schedule.raw);
    })!;
    const dates = getOfficialSchedule(event.id).dates;
    const check = (endDate: string) => verifyEvent({ title: event.title, venue: event.venue ?? "", date: dates[0]!, endDate, officialRecordId: event.id }).fields.find((field) => field.label === "날짜")!;
    expect(check(dates[dates.length - 1]!).status).toBe("same");
    expect(check("2099-12-03").status).toBe("different");
    expect(verifyEvent({ title: event.title, venue: event.venue ?? "", date: dates[0]!, officialRecordId: event.id }).fields.find((field) => field.label === "날짜")?.status).toBe("missing");
  });
  it("does not treat separated sessions as a continuous period", () => {
    const event = searchOfficialEvents("").find((item) => {
      const schedule = getOfficialSchedule(item.id);
      return schedule.dates.length === 2 && /\//.test(schedule.raw);
    })!;
    const dates = getOfficialSchedule(event.id).dates;
    expect(verifyEvent({ title: event.title, venue: event.venue ?? "", date: dates[0]!, endDate: dates[1]!, officialRecordId: event.id }).fields.find((field) => field.label === "날짜")?.status).toBe("missing");
  });
});
