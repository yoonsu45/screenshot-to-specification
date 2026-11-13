import { describe, expect, it } from "vitest";
import { parseParkingHistoryPayload } from "@/lib/parking-service";

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
