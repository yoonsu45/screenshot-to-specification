import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import snapshot from "@/data/official-events.json";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(() => false),
  addPlan: vi.fn(),
  removePlan: vi.fn(),
}));
vi.mock("@/lib/app-store", () => ({
  useAppStore: () => ({
    facilityId: "all",
    plan: [],
    eventSaveCounts: {},
    requireAuth: mocks.requireAuth,
    addPlan: mocks.addPlan,
    removePlan: mocks.removePlan,
  }),
}));
import { OfficialEventBrowser } from "@/components/app/OfficialEventBrowser";

describe("OfficialEventBrowser", () => {
  it("paginates official records and passes the selected record without inventing poster values", () => {
    render(<OfficialEventBrowser />);
    expect(screen.getAllByRole("button", { name: "방문 계획에 담기" })).toHaveLength(20);
    expect(screen.getAllByText("담은 인원 확인 중")).toHaveLength(20);
    expect(screen.getAllByRole("button", { name: /상세 보기$/ })).toHaveLength(20);
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByRole("button", { name: "이전" })).toBeEnabled();
    fireEvent.change(screen.getByRole("spinbutton", { name: "이동할 페이지" }), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "이동" }));
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: snapshot.events[0]!.title },
    });
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: /상세 보기$/ })[0]!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이 공식 자료와 비교하기" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/행사명·장소가 일치/)).not.toBeInTheDocument();
  }, 15000);
});
