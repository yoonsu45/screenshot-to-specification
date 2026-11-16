import { expect, it } from "vitest";
import { joinTsParking } from "@/lib/ts-parking";

const facility = { prk_center_id: "a", prk_manage_agent: "1", prk_cmprt_co: "61", prk_plce_nm: "방이고분", prk_plce_adres: "송파구", prk_plce_entrc_la: "37.50757311", prk_plce_entrc_lo: "127.1181634" };
const live = { prk_center_id: "a", pkfc_ParkingLots_total: "61", pkfc_Available_ParkingLots_total: "0" };
const facilities = (rows: unknown[]) => ({ resultCode: "0", PrkSttusInfo: rows });
const realtime = (rows: unknown[]) => ({ resultCode: "0", PrkRealtimeInfo: rows });

it("joins by exact ID and preserves a real zero remaining count", () => {
  expect(joinTsParking(facilities([facility]), realtime([live]))[0]?.remaining).toBe(0);
  expect(joinTsParking(facilities([facility]), realtime([{ ...live, prk_center_id: "other" }]))).toEqual([]);
});

it("excludes conflicting capacities, unnamed/private facilities and impossible counts", () => {
  for (const altered of [{ ...facility, prk_cmprt_co: "60" }, { ...facility, prk_manage_agent: "2" }, { ...facility, prk_plce_nm: "" }, { ...facility, prk_plce_entrc_la: "" }]) {
    expect(joinTsParking(facilities([altered]), realtime([live]))).toEqual([]);
  }
  for (const remaining of ["", "-1", "62"]) expect(joinTsParking(facilities([facility]), realtime([{ ...live, pkfc_Available_ParkingLots_total: remaining }]))).toEqual([]);
  expect(() => joinTsParking({ resultCode: "99" }, realtime([]))).toThrow();
});
