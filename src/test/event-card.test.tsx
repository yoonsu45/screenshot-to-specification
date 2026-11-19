import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "@/components/app/EventCard";
import type { ParkEvent } from "@/data/events";

vi.mock("@/lib/app-store", () => ({
  useAppStore: () => ({
    addPlan: vi.fn(),
    removePlan: vi.fn(),
    plan: [],
    requireAuth: vi.fn(() => true),
    userEmail: "test@example.com",
    eventSaveCounts: {},
  }),
}));

const event: ParkEvent = {
  id: "event-card-poster-test",
  title: "상세 포스터 테스트 행사",
  facilityId: "olympic-park",
  venue: "올림픽홀",
  category: "공연",
  startDate: "2026-11-22",
  image: "/posters/event_01.jpg",
  sourceType: "demo",
};

describe("행사 상세정보", () => {
  it("행사 카드를 누르면 상세 창에 포스터를 표시한다", () => {
    render(<EventCard event={event} />);

    fireEvent.click(screen.getByRole("button", { name: /상세 포스터 테스트 행사/ }));

    expect(screen.getByRole("img", { name: "상세 포스터 테스트 행사 포스터" })).toHaveAttribute(
      "src",
      event.image,
    );
  });
});
