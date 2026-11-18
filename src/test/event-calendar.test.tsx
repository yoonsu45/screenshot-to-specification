import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCalendar } from "@/components/app/EventCalendar";
import type { ParkEvent } from "@/data/events";

vi.mock("@/components/app/EventCard", () => ({
  EventCard: ({ event }: { event: ParkEvent }) => <article>{event.title}</article>,
}));

const event: ParkEvent = {
  id: "calendar-test-event",
  title: "달력 선택 테스트 행사",
  facilityId: "olympic-park",
  venue: "올림픽홀",
  category: "공연",
  startDate: "2026-11-12",
  endDate: "2026-11-12",
  image: "/placeholder.svg",
  sourceType: "demo",
};

describe("행사 달력", () => {
  it("현재 달의 마지막 날짜가 포함된 주까지만 표시한다", () => {
    render(<EventCalendar events={[event]} />);

    expect(screen.getByRole("button", { name: "12월 5일" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "12월 6일" })).not.toBeInTheDocument();
  });

  it("행사가 있는 날짜를 누르면 해당 날짜의 행사 창을 연다", () => {
    render(<EventCalendar events={[event]} />);

    fireEvent.click(screen.getByRole("button", { name: "11월 12일, 행사 1개" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/11월 12일.*행사/)).toBeInTheDocument();
    expect(within(dialog).getByText("달력 선택 테스트 행사")).toBeInTheDocument();
  });

  it("행사가 없는 날짜도 빈 일정 안내 창을 연다", () => {
    render(<EventCalendar events={[event]} />);

    fireEvent.click(screen.getByRole("button", { name: "11월 13일" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("이 날짜에 예정된 행사가 없어요.");
  });
});
