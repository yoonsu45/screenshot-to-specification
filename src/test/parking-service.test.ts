import { describe, expect, it } from "vitest";
import {
  classifyParkingHttpFailure,
  classifyParkingProviderFailure,
  parseParkingHistoryPayload,
  shouldRetryParkingHttpStatus,
} from "@/lib/parking-service";

describe("parseParkingHistoryPayload", () => {
  it("공식 API의 DESCRIPTION에서 입출차 표본을 추출한다", () => {
    const result = parseParkingHistoryPayload({
      response: {
        body: {
          totalCount: 2_400_000,
          items: {
            item: [
              {
                TITLE: "올림픽공원 입출차정보",
                DESCRIPTION:
                  "입차일시: 20250102103000 | 출차일시: 20250102124500 | 주차구역: 동2문",
              },
              {
                TITLE: "올림픽공원 입출차정보",
                DESCRIPTION: "입차일시=20250103150000; 주차구역=남2문",
              },
            ],
          },
        },
      },
    });

    expect(result.totalCount).toBe(2_400_000);
    expect(result.samples).toEqual([
      { entryAt: "20250102103000", exitAt: "20250102124500", zone: "동2문" },
      { entryAt: "20250103150000", exitAt: null, zone: "남2문" },
    ]);
  });

  it("직접 명명된 필드와 출차 기록이 없는 데이터도 지원한다", () => {
    const result = parseParkingHistoryPayload({
      items: [
        {
          entryDateTime: "2025-01-02 10:30:00",
          exitDateTime: "",
          parkingZone: "북2문",
        },
      ],
    });

    expect(result.samples[0]).toEqual({
      entryAt: "2025-01-02 10:30:00",
      exitAt: null,
      zone: "북2문",
    });
  });
});

describe("주차 API 오류 분류", () => {
  it("공식 정상 코드 00과 0000을 모두 성공으로 처리한다", () => {
    expect(classifyParkingProviderFailure({ resultCode: "00" })).toBeNull();
    expect(classifyParkingProviderFailure({ header: { resultCode: "0000" } })).toBeNull();
  });

  it("제공기관 오류 코드를 원인별로 구분한다", () => {
    expect(classifyParkingProviderFailure({ resultCode: "F2013" })).toEqual({
      ok: false,
      code: "PROVIDER_CALL_FAILED",
      providerCode: "F2013",
    });
    expect(classifyParkingProviderFailure({ resultCode: "9999" })).toEqual({
      ok: false,
      code: "PROVIDER_MAINTENANCE",
      providerCode: "9999",
    });
    expect(classifyParkingProviderFailure({ resultCode: "31" })).toEqual({
      ok: false,
      code: "KEY_EXPIRED",
      providerCode: "31",
    });
    expect(classifyParkingProviderFailure({ resultCode: "32" })).toEqual({
      ok: false,
      code: "IP_RESTRICTED",
      providerCode: "32",
    });
  });

  it("HTTP 상태를 인증, 요청, 서비스, 제공기관 오류로 구분한다", () => {
    expect(classifyParkingHttpFailure(200)).toBeNull();
    expect(classifyParkingHttpFailure(400)?.code).toBe("BAD_REQUEST");
    expect(classifyParkingHttpFailure(401)?.code).toBe("AUTH_FAILED");
    expect(classifyParkingHttpFailure(404)?.code).toBe("SERVICE_NOT_FOUND");
    expect(classifyParkingHttpFailure(429)?.code).toBe("RATE_LIMITED");
    expect(classifyParkingHttpFailure(503)).toEqual({
      ok: false,
      code: "PROVIDER_HTTP_ERROR",
      httpStatus: 503,
    });
  });

  it("일시적인 게이트웨이 오류만 한 번 더 시도한다", () => {
    expect([502, 503, 504].every(shouldRetryParkingHttpStatus)).toBe(true);
    expect([400, 401, 403, 404, 429, 500].some(shouldRetryParkingHttpStatus)).toBe(false);
  });

  it("응답 본문이나 긴 비정상 코드는 브라우저 진단값으로 전달하지 않는다", () => {
    expect(classifyParkingProviderFailure({ resultCode: "not a safe diagnostic value" })).toEqual({
      ok: false,
      code: "UNKNOWN",
    });
  });
});
