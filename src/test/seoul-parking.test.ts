import { describe, it, expect } from "vitest";
import { getSeoulAvailability, parseSeoulParking, type SeoulParkingLot } from "@/lib/seoul-parking";

const now = Date.parse("2026-11-16T17:05:00+09:00");
const lot: SeoulParkingLot = { id: "173646", name: "신천유수지", address: "송파구", capacity: 192, occupied: 146, linked: true, updatedAt: "2026-11-16 17:01:23", latitude: 37.51, longitude: 127.1 };

describe("Seoul parking availability", () => {
  it("calculates remaining spaces using the source timestamp in Korea", () => {
    expect(getSeoulAvailability(lot, now)).toEqual({ remaining: 46, label: "보통" });
    expect(getSeoulAvailability({ ...lot, occupied: 192 }, now)).toEqual({ remaining: 0, label: "만차" });
    expect(getSeoulAvailability({ ...lot, occupied: 0 }, now)).toEqual({ remaining: 192, label: "여유" });
    expect(getSeoulAvailability({ ...lot, occupied: 190 }, now)?.label).toBe("혼잡");
  });
  it("never reports stale, disconnected, missing or inconsistent occupancy as available", () => {
    for (const patch of [{ updatedAt: "2026-11-16 16:00:00" }, { updatedAt: "2026-11-17 17:00:00" }, { linked: false }, { occupied: null }, { occupied: 193 }, { capacity: 0 }, { updatedAt: null }]) {
      expect(getSeoulAvailability({ ...lot, ...patch }, now)).toBeNull();
    }
  });
  it("accepts documented fields and excludes noncandidate lots and invalid numeric values", () => {
    const row = { PKLT_CD: "173646", PKLT_NM: "신천유수지", ADDR: "송파구", TPKCT: 192, NOW_PRK_VHCL_CNT: "", PRK_STTS_YN: "1", NOW_PRK_VHCL_UPDT_TM: "2026-11-16 17:01:23", LAT: "37.51", LNG: "127.1" };
    const parsed = parseSeoulParking({ GetParkingInfo: { RESULT: { CODE: "INFO-000" }, row: [row, { ...row, PKLT_CD: "other" }] } });
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.occupied).toBeNull();
    expect(parsed[0]?.latitude).toBe(37.51);
    expect(parsed[0]?.longitude).toBe(127.1);
    expect(() => parseSeoulParking({ RESULT: { CODE: "INFO-100" } })).toThrow();
  });
});
