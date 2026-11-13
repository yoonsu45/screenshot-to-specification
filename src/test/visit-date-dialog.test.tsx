import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ParkEvent } from "@/data/events";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";

const event: ParkEvent = {
  sourceType: "demo",
  id: "test-event",
  title: "테스트 행사",
  facilityId: "olympic-park",
  venue: "올림픽홀",
  category: "공연",
  startDate: "2026-11-14",
  endDate: "2026-11-15",
  image: "/event.jpg",
};

describe("VisitDateDialog", () => {
  it("opens the in-app calendar and selects a visit date", () => {
    const onConfirm = vi.fn();
    const { container } = render(
      <VisitDateDialog event={event} open onOpenChange={vi.fn()} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "방문 예정일 선택" }));

    expect(screen.getByRole("button", { name: "방문 예정일 선택" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(container.ownerDocument.querySelector("#visit-date-calendar")).not.toBeNull();

    const date = new Date(2026, 10, 14);
    const dayButton = container.ownerDocument.querySelector<HTMLButtonElement>(
      `[data-day="${date.toLocaleDateString()}"]`,
    );
    expect(dayButton).not.toBeNull();
    fireEvent.click(dayButton!);

    expect(container.ownerDocument.querySelector("#visit-date-calendar")).toBeNull();

    expect(screen.getByRole("button", { name: "방문 예정일 선택" })).toHaveTextContent(
      "2026.11.14",
    );
    fireEvent.click(screen.getByRole("button", { name: "이 날짜로 담기" }));
    expect(onConfirm).toHaveBeenCalledWith("2026-11-14");
  });
});
