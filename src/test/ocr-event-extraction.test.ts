import { describe, expect, it } from "vitest";
import { parseOcrText } from "@/lib/ocr-event-extraction";

describe("parseOcrText", () => {
  it("행사 날짜와 예매 오픈 날짜를 분리한다", () => {
    const result = parseOcrText(
      `
      가상 별빛 콘서트
      2026.11.14 SAT
      올림픽홀
      TICKET OPEN 2026.10.20
    `,
      2026,
    );

    expect(result.title).toBe("[시연용] 가상 별빛 콘서트");
    expect(result.date).toBe("2026-11-14");
    expect(result.venue).toBe("올림픽홀");
    expect(result.bookingDates).toEqual(["2026-10-20"]);
    expect(result.candidates[0]?.eventId).toBe("demo-concert-2026");
  });

  it("연도가 없는 날짜는 채우지 않고 시연 후보만 제시한다", () => {
    const result = parseOcrText(
      `
      가을 음악회
      11월 12일
      88잔디마당
    `,
      2026,
    );

    expect(result.date).toBe("");
    expect(result.venue).toBe("88잔디마당");
    expect(result.candidates[0]?.eventId).toBe("autumn-concert");
  });

  it("예매 날짜만 있으면 행사 날짜 입력칸을 비워 둔다", () => {
    const result = parseOcrText(
      `
      티켓 오픈
      2026.10.20
      아직 공개되지 않은 공연
    `,
      2026,
    );

    expect(result.date).toBe("");
    expect(result.detectedDates).toEqual([]);
    expect(result.bookingDates).toEqual(["2026-10-20"]);
  });

  it("시연 접두어가 없는 포스터에서도 가상 행사 후보를 찾는다", () => {
    const result = parseOcrText("윈터 페스타 라이브\nKSPO DOME", 2026);

    expect(result.candidates[0]?.eventId).toBe("kspo-winter");
    expect(result.candidates[0]?.score).toBeGreaterThan(0.8);
  });
});
