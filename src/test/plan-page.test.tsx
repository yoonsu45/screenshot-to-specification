import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import snapshot from "@/data/official-events.json";

const event = snapshot.events[0]!;

vi.mock("@/lib/app-store", () => ({
  useAppStore: () => ({
    plan: [
      {
        id: `event:${event.id}`,
        kind: "event",
        title: event.title,
        subtitle: `개인 방문예정일 2026-12-01 · ${event.venue}`,
        startDate: "2026-12-01",
        endDate: "2026-12-01",
        venue: event.venue,
        dateKind: "personal",
      },
    ],
    removePlan: vi.fn(),
    userEmail: "visitor@example.com",
    authLoaded: true,
    setAuthOpen: vi.fn(),
  }),
}));

import { Plan } from "@/routes/plan";

describe("내 방문 계획", () => {
  it("연월 이동, 월 전체 보기, 행사 상세와 공식 홈페이지 연결을 제공한다", () => {
    render(<Plan />);

    fireEvent.change(screen.getByLabelText("연도와 월 선택"), {
      target: { value: "2026-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "이달 전체" }));

    expect(screen.getByText("2026년 12월 전체 일정")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "2026년 12월 1일 화 일정" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `${event.title} 행사 정보 보기` }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("방문 예정일")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공식 홈페이지" })).toHaveAttribute(
      "href",
      "https://www.ksponco.or.kr/olympicpark/",
    );
  });
});
