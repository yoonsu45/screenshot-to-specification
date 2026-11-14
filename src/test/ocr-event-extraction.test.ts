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

  it("한 글자를 잘못 읽은 공연장도 유사도로 찾는다", () => {
    const result = parseOcrText("가상 별빛 콘서트\n2026.11.14\n올림픽흘", 2026);

    expect(result.venue).toBe("올림픽홀");
    expect(result.candidates[0]?.eventId).toBe("demo-concert-2026");
  });

  it("관련 없는 이미지에는 시연용 행사를 억지로 추천하지 않는다", () => {
    const result = parseOcrText("오늘의 메뉴\n아메리카노 4500원\n영업시간 10:00", 2026);

    expect(result.title).toBe("");
    expect(result.candidates).toEqual([]);
  });

  it("공식 행사명이 정확히 읽히면 공식 후보를 우선 제시한다", () => {
    const result = parseOcrText("김조한 콘서트\n우리금융아트홀", 2026);

    expect(result.title).toBe("김조한 콘서트");
    expect(result.candidates[0]).toMatchObject({
      eventId: "official-poster-6002",
      sourceType: "official_public_data",
    });
  });

  it("등록되지 않은 행사도 날짜와 장소 문맥으로 행사명을 추출한다", () => {
    const result = parseOcrText("CRAVITY\n2026.11.14\n고척스카이돔", 2026);

    expect(result.title).toBe("CRAVITY");
    expect(result.date).toBe("2026-11-14");
    expect(result.venue).toBe("고척스카이돔");
  });

  it("연도 없는 날짜도 행사명 추출 문맥으로 사용한다", () => {
    const result = parseOcrText("CRAVITY\n11.14 SAT", 2026);

    expect(result.title).toBe("CRAVITY");
    expect(result.date).toBe("");
  });

  it("등록되지 않은 한글 행사명과 공연장을 원문에서 추출한다", () => {
    const result = parseOcrText(
      "별이 빛나는 밤 콘서트\n2026년 12월 24일\n블루스퀘어 마스터카드홀",
      2026,
    );

    expect(result.title).toBe("별이 빛나는 밤 콘서트");
    expect(result.venue).toBe("블루스퀘어 마스터카드홀");
  });

  it("해시태그 묶음을 행사명으로 사용하지 않는다", () => {
    const result = parseOcrText(
      "CRAVITY THE DREAM SHOW\n2026.11.14\n#크래비티 #CRAVITY #콘서트 #올림픽공원 #주말공연",
      2026,
    );

    expect(result.title).toBe("CRAVITY THE DREAM SHOW");
  });

  it("행사명 뒤의 해시태그는 제거하고 실제 제목만 남긴다", () => {
    const result = parseOcrText("별이 빛나는 밤 콘서트 #공연 #콘서트 #데이트\n2026.12.24", 2026);

    expect(result.title).toBe("별이 빛나는 밤 콘서트");
  });

  it("해시태그와 날짜뿐이면 해시태그를 행사명으로 확정하지 않는다", () => {
    const result = parseOcrText("#크래비티 #콘서트 #서울공연\n2026.11.14", 2026);

    expect(result.title).toBe("");
  });

  it("등록된 행사명도 해시태그에만 있으면 행사 후보나 제목으로 확정하지 않는다", () => {
    const result = parseOcrText("# 가상별빛콘서트 # 올림픽홀\n2026.11.14", 2026);

    expect(result.title).toBe("");
    expect(result.candidates).toEqual([]);
  });
});
