import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import snapshot from "@/data/official-events.json";

const mocks = vi.hoisted(() => ({ setDraft: vi.fn(), navigate: vi.fn() }));
vi.mock("@/lib/app-store", () => ({ useAppStore: () => ({ setDraft: mocks.setDraft }) }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
import { OfficialEventBrowser } from "@/components/app/OfficialEventBrowser";

describe("OfficialEventBrowser", () => {
  it("paginates official records and passes the selected record without inventing poster values", () => {
    render(<OfficialEventBrowser />);
    expect(screen.getAllByRole("button", { name: "이 공식 자료와 비교하기" })).toHaveLength(20);
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByRole("button", { name: "이전" })).toBeEnabled();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: snapshot.events[0]!.title },
    });
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "이 공식 자료와 비교하기" })[0]!);
    expect(mocks.setDraft).toHaveBeenCalledWith({
      title: snapshot.events[0]!.title,
      date: "",
      venue: "",
      officialRecordId: snapshot.events[0]!.id,
    });
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/check" });
  });
});
