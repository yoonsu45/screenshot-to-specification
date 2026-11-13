import { describe, expect, it } from "vitest";
import api from "@/data/official-events.json";
import posterEvents from "@/data/official-poster-events.json";
import posters from "@/data/official-posters.json";
import { officialEvents, officialRecordSource } from "@/lib/official-data";
import { searchOfficialEvents, verifyEvent } from "@/lib/event-service";
import { getOfficialSchedule, parsePosterSchedule } from "@/lib/official-posters";

describe("공식 포스터 독립 자료", () => {
  it("keeps existing API identities and adds unique poster identities", () => {
    expect(officialEvents).toHaveLength(api.events.length + posterEvents.events.length);
    expect(new Set(officialEvents.map((event) => event.id)).size).toBe(officialEvents.length);
    expect(
      posters.matches.every((poster) =>
        officialEvents.some((event) => event.id === poster.eventId),
      ),
    ).toBe(true);
    expect(
      posters.matches.filter(
        (poster) => poster.matchMethod === "unique_normalized_title_and_venue",
      ),
    ).toHaveLength(15);
  });
  it("searches standalone records and attributes comparisons to the poster source", () => {
    const event = posterEvents.events.find(
      (item) => item.venue && getOfficialSchedule(item.id).dates.length,
    )!;
    expect(searchOfficialEvents(event.title).some((item) => item.id === event.id)).toBe(true);
    expect(officialRecordSource(event.id)).toBe("공식 공연 포스터 정보");
    const result = verifyEvent({
      title: event.title,
      date: getOfficialSchedule(event.id).dates[0]!,
      venue: event.venue!,
      officialRecordId: event.id,
    });
    expect(result).toMatchObject({ status: "match", sourceName: "공식 공연 포스터 정보" });
  });
  it("validates unpadded dates and separated comma sessions without guessing malformed text", () => {
    expect(parsePosterSchedule("2011-9-18(일) 6:00").dates).toEqual(["2011-09-18"]);
    expect(parsePosterSchedule("2008-06-13(금) 8:00, 2008-06-14(토) 7:00").dates).toEqual([
      "2008-06-13",
      "2008-06-14",
    ]);
    expect(parsePosterSchedule("2016-03-13(금) 8:00, 2016-03-14(토) 7:00").issue).not.toBeNull();
  });
});
