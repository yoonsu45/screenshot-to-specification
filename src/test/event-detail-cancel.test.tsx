import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventCard } from "@/components/app/EventCard";
import type { ParkEvent } from "@/data/events";

const mocks = vi.hoisted(() => ({
  removePlan: vi.fn(async () => true),
}));

const event: ParkEvent = {
  id: "saved-detail-event",
  title: "상세정보 취소 테스트 행사",
  facilityId: "olympic-park",
  venue: "올림픽홀",
  category: "공연",
  startDate: "2026-11-22",
  image: "/posters/event_01.jpg",
  sourceType: "demo",
};

vi.mock("@/lib/app-store", () => ({
  useAppStore: () => ({
    addPlan: vi.fn(),
    removePlan: mocks.removePlan,
    plan: [
      {
        id: `event:${event.id}`,
        kind: "event",
        title: event.title,
        subtitle: event.venue,
        startDate: event.startDate,
        endDate: event.startDate,
        venue: event.venue,
      },
    ],
    requireAuth: vi.fn(() => true),
    userEmail: "test@example.com",
    eventSaveCounts: { [event.id]: 1 },
  }),
}));

describe("행사 상세정보 담기 취소", () => {
  beforeEach(() => {
    mocks.removePlan.mockClear();
  });

  it("담은 행사의 상세정보 창에서 담기를 취소한다", async () => {
    render(<EventCard event={event} />);

    fireEvent.click(screen.getByRole("button", { name: /상세정보 취소 테스트 행사/ }));
    fireEvent.click(screen.getByRole("button", { name: "담기 취소" }));

    await waitFor(() => {
      expect(mocks.removePlan).toHaveBeenCalledWith(`event:${event.id}`);
    });
  });
});
