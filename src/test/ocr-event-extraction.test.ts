import { describe, expect, it } from "vitest";
import { parseOcrText } from "@/lib/ocr-event-extraction";

describe("parseOcrText", () => {
  it("행사 날짜와 예매 오픈 날짜를 분리한다", () => {
    const result = parseOcrText(
      `
      2026 서울 윈터 사운드 페스타
      2026.11.21 SAT
      KSPO DOME
      TICKET OPEN 2026.10.20
    `,
      2026,
    );

    expect(result.title).toBe("서울 윈터 사운드 페스타");
    expect(result.date).toBe("2026-11-21");
    expect(result.venue).toBe("KSPO-DOME");
    expect(result.bookingDates).toEqual(["2026-10-20"]);
    expect(result.candidates[0]?.eventId).toBe("OLP-DEMO-001");
  });

  it("연도가 없는 날짜는 채우지 않고 시연 후보만 제시한다", () => {
    const result = parseOcrText(
      `
      별빛 아래 인디나잇
      11월 27일
      올림픽홀
    `,
      2026,
    );

    expect(result.date).toBe("");
    expect(result.venue).toBe("올림픽홀");
    expect(result.candidates[0]?.eventId).toBe("OLP-DEMO-002");
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
    const result = parseOcrText("재즈 온 더 파크\n우리금융아트홀", 2026);

    expect(result.candidates[0]?.eventId).toBe("OLP-DEMO-006");
    expect(result.candidates[0]?.score).toBeGreaterThan(0.8);
  });

  it("한 글자를 잘못 읽은 공연장도 유사도로 찾는다", () => {
    const result = parseOcrText("별빛 아래 인디나잇\n2026.11.27\n올림픽흘", 2026);

    expect(result.venue).toBe("올림픽홀");
    expect(result.candidates[0]?.eventId).toBe("OLP-DEMO-002");
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

  it("SNS 게시물의 설명문 대신 꺾쇠 안 작품명을 행사명으로 선택한다", () => {
    const result = parseOcrText(
      [
        "글쓰기",
        "2012년 9월 21일, SLE.",
        "봄여름가을겨울의 <브라보 마이 라이프> 10",
        "포스터.",
        "두 사람이 소파에 기대어 웃고 있고, 그 위엔 큼직한 사인과",
        "글씨로 적힌 “Bravo!”",
        "사진 보고 있자니 오랜만에 이 노래 다시 듣고 싶어진다.",
        "#봄여름가을겨울 #브라보마이라이프 #BravoMyLife #공연",
      ].join("\n"),
      2026,
    );

    expect(result.title).toBe("브라보 마이 라이프");
    expect(result.titleSuggestions[0]).toBe("브라보 마이 라이프");
    expect(result.titleSuggestions).not.toContain(
      "두 사람이 소파에 기대어 웃고 있고, 그 위엔 큼직한 사인과",
    );
    expect(result.date).toBe("2012-09-21");
  });

  it("괄호 뒤의 회차와 공연 유형까지 행사명에 포함한다", () => {
    const result = parseOcrText(
      "2012년 9월 21일, 올림픽홀.\n봄여름가을겨울의 <브라보 마이 라이프> 10주년 콘서트\n포스터.",
      2026,
    );

    expect(result.title).toBe("브라보 마이 라이프 10주년 콘서트");
    expect(result.venue).toBe("올림픽홀");
  });

  it("SNS 계정명과 UI 문구를 버리고 본문의 행사명을 우선한다", () => {
    const result = parseOcrText(
      [
        "릴스",
        "= the.check_demo",
        "팔로우",
        "2011 인순이 콘서트 (The Fantasia)✨",
        "2011년 10월 30일 (일)",
        "올림픽공원 체조경기장",
        "2011년 공연 기록",
        "#인순이 #인순이콘서트 #TheFantasia #공연기록",
      ].join("\n"),
      2026,
    );

    expect(result.title).toContain("인순이 콘서트");
    expect(result.venue).toBe("올림픽공원 체조경기장");
    expect(result.titleSuggestions).not.toContain("the.check_demo");
    expect(result.titleSuggestions).not.toContain("2011년 공연 기록");
  });

  it("기호와 한 글자 토큰이 뒤섞인 OCR 오인식은 행사명 후보에서 제외한다", () => {
    const result = parseOcrText(
      "ht Aid) es A Pa | Sho} Cx 4 Po)\n2026.11.14\n올림픽홀",
      2026,
    );

    expect(result.title).toBe("");
    expect(result.titleSuggestions).toEqual([]);
  });
});
