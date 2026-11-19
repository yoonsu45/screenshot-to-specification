import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

afterEach(() => { toast.dismiss(); });

describe("알림 밀어서 닫기", () => {
  it("알림을 위로 밀면 해당 알림을 닫는다", async () => {
    render(<Toaster position="top-center" swipeDirections={["top"]} />);
    act(() => { toast.success("방문 계획에 담았어요", { duration: 60000 }); });
    const message = await screen.findByText("방문 계획에 담았어요");
    const item = message.closest("[data-sonner-toast]")!;
    fireEvent.touchStart(message, { touches: [{ identifier: 1, clientX: 80, clientY: 100 }] });
    fireEvent.touchMove(message, { touches: [{ identifier: 1, clientX: 82, clientY: 50 }] });
    fireEvent.touchEnd(message, { changedTouches: [{ identifier: 1, clientX: 82, clientY: 50 }] });
    await waitFor(() => expect(item).toHaveAttribute("data-removed", "true"));
  });
});
