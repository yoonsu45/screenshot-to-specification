import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

afterEach(() => {
  toast.dismiss();
  document.body.style.pointerEvents = "";
});

describe("알림 밀어서 닫기", () => {
  const swipeToastUp = (target: Element) => {
    fireEvent.touchStart(target, {
      touches: [{ identifier: 1, clientX: 80, clientY: 100 }],
    });
    fireEvent.touchMove(target, {
      touches: [{ identifier: 1, clientX: 82, clientY: 50 }],
    });
    fireEvent.touchEnd(target, {
      changedTouches: [{ identifier: 1, clientX: 82, clientY: 50 }],
    });
  };

  it("알림을 위로 밀면 해당 알림을 닫는다", async () => {
    render(<Toaster position="top-center" swipeDirections={["top"]} />);
    act(() => {
      toast.success("방문 계획에 담았어요", { duration: 60000 });
    });

    const message = await screen.findByText("방문 계획에 담았어요");
    const item = message.closest("[data-sonner-toast]")!;
    swipeToastUp(message);

    await waitFor(() => expect(item).toHaveAttribute("data-removed", "true"));
  });

  it("상세정보 모달이 페이지 터치를 잠가도 알림을 위로 밀어 닫는다", async () => {
    document.body.style.pointerEvents = "none";
    render(<Toaster position="top-center" />);
    act(() => {
      toast.success("상세정보에서 방문 계획에 담았어요", { duration: 60000 });
    });

    const message = await screen.findByText("상세정보에서 방문 계획에 담았어요");
    const item = message.closest("[data-sonner-toast]")!;
    const toaster = item.closest("[data-sonner-toaster]");

    expect(toaster).toHaveClass("pointer-events-auto");
    expect(item).toHaveClass("pointer-events-auto");
    swipeToastUp(message);

    await waitFor(() => expect(item).toHaveAttribute("data-removed", "true"));
  });
});
