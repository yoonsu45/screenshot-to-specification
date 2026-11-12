import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LoginDialog } from "@/components/app/LoginDialog";
import { AppStoreProvider, useAppStore } from "@/lib/app-store";

const memory = new Map<string, string>();
const memoryStorage: Storage = {
  get length() {
    return memory.size;
  },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => Array.from(memory.keys())[index] ?? null,
  removeItem: (key) => {
    memory.delete(key);
  },
  setItem: (key, value) => {
    memory.set(key, String(value));
  },
};

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryStorage,
});

function AddButton() {
  const { requireAuth } = useAppStore();
  return <button onClick={() => requireAuth()}>담기</button>;
}

describe("login-required confirmation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("closes on no and opens the login form on yes", async () => {
    render(
      <AppStoreProvider>
        <AddButton />
        <LoginDialog />
      </AppStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "담기" }));
    expect(screen.getByText("로그인이 필요한 서비스입니다. 로그인하시겠습니까?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "아니요" }));
    await waitFor(() => {
      expect(screen.queryByText("로그인이 필요한 서비스입니다. 로그인하시겠습니까?")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "담기" }));
    fireEvent.click(screen.getByRole("button", { name: "예" }));

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "회원가입" })).toBeInTheDocument();
  });
});
