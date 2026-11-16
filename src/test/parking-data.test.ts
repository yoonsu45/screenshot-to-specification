import { describe, it, expect } from "vitest";
import { getParkingMapDestination, getVenueParking, parseLiveParking, parseParkingHistory } from "@/lib/parking-data";

describe("official parking data", () => {
  it("preserves zero but rejects missing, negative and textual live values", () => {
    expect(parseLiveParking([{ parking_sum: 0 }])).toBe(0);
    expect(parseLiveParking([{ parking_sum: 2110 }])).toBe(2110);
    for (const data of [[], [{ parking_sum: -1 }], [{ parking_sum: "200" }], [{ error: "9999" }]]) {
      expect(() => parseLiveParking(data)).toThrow();
    }
  });
  it("uses observation time rather than collection time and does not infer parking from entries", () => {
    const xml = `<response><resultCode>0000</resultCode><item><ISSUED_DATE>2025-07-24 15:00:00</ISSUED_DATE><COLLECTED_DATE>2026-08-31 09:00:00</COLLECTED_DATE><DESCRIPTION><![CDATA[주차대수:2284,방문객:6852]]></DESCRIPTION></item><item><ISSUED_DATE>2025-07-24 16:00:00</ISSUED_DATE><DESCRIPTION>입차:500,출차:200</DESCRIPTION></item></response>`;
    expect(parseParkingHistory(xml)).toEqual([{ at: "2025-07-24 15:00:00", count: 2284 }]);
    expect(() => parseParkingHistory("<resultCode>9999</resultCode>")).toThrow();
  });
  it("selects different official parking for venues sharing a transit guide", () => {
    expect(getVenueParking("KSPO-DOME")?.primary).toBe("P5");
    expect(getVenueParking("우리금융아트홀")?.primary).toBe("P7");
    expect(getVenueParking("티켓링크 라이브 아레나")?.primary).toBe("P6");
    expect(getVenueParking("unknown")).toBeNull();
  });
  it("provides a fixed map coordinate for every internal parking candidate", () => {
    const venues = [
      "KSPO-DOME",
      "티켓링크 라이브 아레나",
      "우리금융아트홀",
      "올림픽홀",
      "뮤즈라이브",
      "만남의 광장",
      "88마당",
      "한얼광장",
      "피크닉 광장",
      "수변무대",
      "평화의 광장",
    ];

    for (const venue of venues) {
      const parking = getVenueParking(venue);
      expect(parking).not.toBeNull();
      for (const name of [parking!.primary, ...parking!.alternatives]) {
        expect(getParkingMapDestination(name), `${venue}: ${name}`).not.toBeNull();
      }
    }
  });
});
