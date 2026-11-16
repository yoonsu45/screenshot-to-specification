import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeaderEventSearch } from "@/components/app/HeaderEventSearch";

const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  }
});

describe("HeaderEventSearch mobile storage fallback", () => {
  it("keeps the app header visible when localStorage access is blocked", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is unavailable", "SecurityError");
      },
    });

    expect(() => render(<HeaderEventSearch />)).not.toThrow();
    expect(screen.getByRole("button", { name: "행사 검색" })).toBeInTheDocument();
  });
});
