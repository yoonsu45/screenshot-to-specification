import { afterEach, describe, expect, it, vi } from "vitest";
import { requestKakaoRoute } from "@/lib/kakao-route.server";

const request = { origin: { latitude: 37.5, longitude: 127.1 }, destination: { latitude: 37.52, longitude: 127.12 }, mode: "public" as const };

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("카카오 길찾기", () => {
  it("서버 키가 없으면 외부 요청을 보내지 않는다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await requestKakaoRoute(request)).toEqual({ status: "missing_key" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("대중교통 경로의 시간, 안내와 좌표를 읽는다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "OK", routes: [{ properties: { totalTime: 600, totalDistance: 1200 }, steps: [{ properties: { guidance: "지하철 이용" }, path: { points: [[127.1, 37.5], [127.12, 37.52]] } }] }] }) }));
    expect(await requestKakaoRoute(request)).toEqual({ status: "ok", duration: 600, distance: 1200, steps: ["지하철 이용"], points: [[127.1, 37.5], [127.12, 37.52]] });
  });

  it("자동차 경로의 좌표 쌍을 읽는다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ routes: [{ result_code: 0, summary: { duration: 300, distance: 2000 }, sections: [{ roads: [{ vertexes: [127.1, 37.5, 127.12, 37.52] }] }] }] }) }));
    expect(await requestKakaoRoute({ ...request, mode: "car" })).toEqual({ status: "ok", duration: 300, distance: 2000, steps: [], points: [[127.1, 37.5], [127.12, 37.52]] });
  });

  it("제공기관의 오류와 경로 없음은 성공으로 표시하지 않는다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ status: "NO_RESULTS" }) }));
    expect(await requestKakaoRoute(request)).toEqual({ status: "unavailable" });
    expect(await requestKakaoRoute(request)).toEqual({ status: "no_route" });
  });

  it("일부 구간의 좌표가 없으면 끊어진 구간을 직선으로 잇지 않는다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "OK", routes: [{ properties: { totalTime: 600, totalDistance: 1200 }, steps: [{ properties: { guidance: "도보" }, path: { points: [[127.1, 37.5], [127.11, 37.51]] } }, { properties: { guidance: "버스" } }] }] }) }));
    const result = await requestKakaoRoute(request);
    expect(result.status === "ok" && result.points).toEqual([]);
  });
});
