import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import snapshot from "@/data/official-events.json";

const mocks = vi.hoisted(() => ({ list: vi.fn(), counts: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getCurrentAccount: async () => ({ email: "visitor@example.com", userId: "user-1" }),
  observeAuthAccount: () => () => {},
  authenticateAccount: vi.fn(),
  createAccount: vi.fn(),
  signOutAccount: vi.fn(),
}));
vi.mock("@/lib/event-saves", () => ({
  listMyEventSaves: mocks.list,
  getEventSaveCounts: mocks.counts,
  saveEventForUser: vi.fn(),
  deleteEventForUser: vi.fn(),
}));
import { AppStoreProvider, useAppStore } from "@/lib/app-store";

function Probe() {
  const { plan, eventSaveCounts } = useAppStore();
  return (
    <>
      <p>{plan[0]?.title}</p>
      <p>{plan[0]?.subtitle}</p>
      <p>집계: {eventSaveCounts[snapshot.events[0]!.id]}</p>
    </>
  );
}

describe("공식 행사 저장 복원", () => {
  it("restores official records with personal dates and server counts", async () => {
    const event = snapshot.events[0]!;
    mocks.list.mockResolvedValue([{ eventId: event.id, visitDate: "2026-12-01" }]);
    mocks.counts.mockResolvedValue({ [event.id]: 3 });
    render(
      <AppStoreProvider>
        <Probe />
      </AppStoreProvider>,
    );
    expect(await screen.findByText(event.title)).toBeInTheDocument();
    expect(
      await screen.findByText(/개인 방문예정일 2026-12-01.*공식 개최일 아님/),
    ).toBeInTheDocument();
    expect(await screen.findByText("집계: 3")).toBeInTheDocument();
    expect(mocks.counts.mock.calls[0]![0]).toContain(event.id);
  });
});
