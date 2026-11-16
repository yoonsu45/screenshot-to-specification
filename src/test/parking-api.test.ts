import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe("parking server integration", () => {
  it("shares in-flight requests and isolates failure without exposing credentials", async () => {
    vi.stubEnv("CULTURE_PARKING_FLOW_API_SERVICE_KEY", "private-flow-test");
    vi.stubEnv("CULTURE_API_SERVICE_KEY", "private-context-test");
    const request = vi.fn(async (url: URL) => {
      if (url.hostname === "www.ksponco.or.kr") return new Response('[{"parking_sum":0}]');
      if (url.pathname.includes("008")) throw new Error("private-flow-test must never escape");
      return new Response('<response><resultCode>0000</resultCode><item><ISSUED_DATE>2025-07-24 15:00:00</ISSUED_DATE><DESCRIPTION><![CDATA[주차대수:2284,방문객:6852]]></DESCRIPTION></item></response>');
    });
    vi.stubGlobal("fetch", request);
    const { readParkingOverview } = await import("@/lib/parking-api.server");
    const [a, b] = await Promise.all([readParkingOverview(), readParkingOverview()]);
    expect(request).toHaveBeenCalledTimes(3);
    expect(a).toEqual(b);
    expect(a.live.readings[0]?.count).toBe(0);
    expect(a.flow.status).toBe("unavailable");
    expect(a.context.readings[0]?.at).toBe("2025-07-24 15:00:00");
    expect(JSON.stringify(a)).not.toContain("private-");
  });

  it("does not contact keyed sources when credentials are missing", async () => {
    vi.stubEnv("CULTURE_PARKING_FLOW_API_SERVICE_KEY", "");
    vi.stubEnv("CULTURE_API_SERVICE_KEY", "");
    const request = vi.fn(async () => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", request);
    const { readParkingOverview } = await import("@/lib/parking-api.server");
    const result = await readParkingOverview();
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.live.status).toBe("unavailable");
    expect(result.flow.status).toBe("missing_key");
    expect(result.context.status).toBe("missing_key");
  });
});
