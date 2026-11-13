import { describe, expect, it } from "vitest";
import snapshot from "@/data/official-events.json";
import { events } from "@/data/events";
import { EXAMPLE_CASE, verifyEvent, searchOfficialEvents } from "@/lib/event-service";

describe("event data provenance", () => {
  it("does not list or verify administrative entries as individual events", () => {
    for (const title of [
      "예약완료",
      "준비대관",
      "철거대관",
      "무대점검",
      "주간행사 계획(3.19-3.25)",
    ]) {
      expect(searchOfficialEvents(title)).toEqual([]);
      expect(verifyEvent({ title, date: "", venue: "" }).status).toBe("unverified");
    }
    expect(searchOfficialEvents("차카게 살자").length).toBeGreaterThan(0);
  });
  it("searches official titles and venues without including demo data", () => {
    expect(searchOfficialEvents("")).toHaveLength(snapshot.events.length);
    expect(searchOfficialEvents("올림픽홀").length).toBeGreaterThan(0);
    expect(searchOfficialEvents("존재하지 않는 검색 xyz")).toEqual([]);
  });

  it("compares the selected official record even when another record shares its title", () => {
    const event = snapshot.events.find(
      (candidate) => snapshot.events.filter((other) => other.title === candidate.title).length > 1,
    )!;
    const result = verifyEvent({
      title: event.title,
      date: "2026-11-14",
      venue: "",
      officialRecordId: event.id,
    });
    expect(result.ambiguous).toBe(false);
    expect(result.sourceRows).toEqual(event.sourceRows);
    expect(result.fields.find((field) => field.label === "날짜")?.status).toBe("missing");
    expect(verifyEvent({ ...EXAMPLE_CASE, officialRecordId: event.id }).sourceType).toBe("demo");
  });
  it("labels fictional examples and keeps official links out of them", () => {
    expect(
      events.every(
        (event) =>
          event.sourceType === "demo" && event.title.startsWith("[시연용]") && !event.officialUrl,
      ),
    ).toBe(true);
    expect(verifyEvent(EXAMPLE_CASE)).toMatchObject({ sourceType: "demo", status: "match" });
    expect(verifyEvent({ ...EXAMPLE_CASE, date: "2026-12-31" }).status).toBe("partial");
  });

  it("does not turn absent official dates into a match or mismatch", () => {
    const event = snapshot.events.find(
      (candidate) =>
        candidate.venue &&
        snapshot.events.filter((other) => other.title === candidate.title).length === 1,
    )!;
    const result = verifyEvent({ title: event.title, date: "2026-11-14", venue: event.venue! });
    expect(result.sourceType).toBe("official_public_data");
    expect(result.fields.find((field) => field.label === "날짜")?.status).toBe("missing");
    expect(result.status).toBe("need-info");
    expect(result.sourceRows?.length).toBeGreaterThan(0);
  });

  it("does not choose the first of several same-title records", () => {
    const event = snapshot.events.find(
      (candidate) => snapshot.events.filter((other) => other.title === candidate.title).length > 1,
    )!;
    expect(verifyEvent({ title: event.title, date: "", venue: "" })).toMatchObject({
      ambiguous: true,
      status: "need-info",
    });
  });

  it("leaves unknown titles unverified", () => {
    expect(
      verifyEvent({ title: "존재하지 않는 테스트 행사 xyz", date: "", venue: "" }).status,
    ).toBe("unverified");
  });
});
