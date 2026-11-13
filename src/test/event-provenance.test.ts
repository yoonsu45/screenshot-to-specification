import { describe, expect, it } from "vitest";
import snapshot from "@/data/official-events.json";
import { events } from "@/data/events";
import { EXAMPLE_CASE, verifyEvent } from "@/lib/event-service";

describe("event data provenance", () => {
  it("labels fictional examples and keeps official links out of them", () => {
    expect(events.every((event) => event.sourceType === "demo" && event.title.startsWith("[시연용]") && !event.officialUrl)).toBe(true);
    expect(verifyEvent(EXAMPLE_CASE)).toMatchObject({ sourceType: "demo", status: "match" });
    expect(verifyEvent({ ...EXAMPLE_CASE, date: "2026-12-31" }).status).toBe("partial");
  });

  it("does not turn absent official dates into a match or mismatch", () => {
    const event = snapshot.events.find((candidate) => candidate.venue && snapshot.events.filter((other) => other.title === candidate.title).length === 1)!;
    const result = verifyEvent({ title: event.title, date: "2026-11-14", venue: event.venue! });
    expect(result.sourceType).toBe("official_public_data");
    expect(result.fields.find((field) => field.label === "날짜")?.status).toBe("missing");
    expect(result.status).toBe("need-info");
    expect(result.sourceRows?.length).toBeGreaterThan(0);
  });

  it("does not choose the first of several same-title records", () => {
    const event = snapshot.events.find((candidate) => snapshot.events.filter((other) => other.title === candidate.title).length > 1)!;
    expect(verifyEvent({ title: event.title, date: "", venue: "" })).toMatchObject({ ambiguous: true, status: "need-info" });
  });

  it("leaves unknown titles unverified", () => {
    expect(verifyEvent({ title: "존재하지 않는 테스트 행사 xyz", date: "", venue: "" }).status).toBe("unverified");
  });
});
