import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

it("shares cached Seoul requests and returns only normalized public fields", async () => {
  vi.stubEnv("SEOUL_OPEN_DATA_API_KEY", "test-secret-seoul");
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ GetParkingInfo: { RESULT: { CODE: "INFO-000" }, row: [{ PKLT_CD: "173646", PKLT_NM: "신천유수지", ADDR: "송파구", TPKCT: 192, NOW_PRK_VHCL_CNT: 146, PRK_STTS_YN: "1", NOW_PRK_VHCL_UPDT_TM: "2026-11-16 17:01:23", extra: "test-secret-seoul" }] } })));
  vi.stubGlobal("fetch", fetcher);
  const { readSeoulParking } = await import("@/lib/seoul-parking.server");
  const [a, b] = await Promise.all([readSeoulParking(), readSeoulParking()]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(a).toEqual(b);
  expect(a.status).toBe("ok");
  expect(a.lots[0]?.occupied).toBe(146);
  expect(JSON.stringify(a)).not.toContain("test-secret-seoul");
});

it("does not expose credential paths in failures", async () => {
  vi.stubEnv("SEOUL_OPEN_DATA_API_KEY", "test-secret-seoul");
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("http://endpoint/test-secret-seoul"); }));
  const { readSeoulParking } = await import("@/lib/seoul-parking.server");
  const result = await readSeoulParking();
  expect(result.status).toBe("unavailable");
  expect(result.lots).toEqual([]);
  expect(JSON.stringify(result)).not.toContain("test-secret-seoul");
});
