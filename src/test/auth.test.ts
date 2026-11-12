import { beforeEach, describe, expect, it } from "vitest";
import { AUTH_SESSION_KEY, authenticateAccount, createAccount } from "@/lib/auth";

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

describe("browser account authentication", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates an account, rejects invalid credentials, and logs in with the correct password", async () => {
    const created = await createAccount("visitor@example.com", "pass1234");
    expect(created).toEqual({ ok: true, email: "visitor@example.com" });
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBe("visitor@example.com");

    const storedAccounts = localStorage.getItem("thecheck-accounts-v1");
    expect(storedAccounts).not.toContain("pass1234");

    localStorage.removeItem(AUTH_SESSION_KEY);
    const wrongPassword = await authenticateAccount("visitor@example.com", "wrong-password");
    expect(wrongPassword).toEqual({ ok: false, error: "비밀번호가 일치하지 않아요." });
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();

    const loggedIn = await authenticateAccount("visitor@example.com", "pass1234");
    expect(loggedIn).toEqual({ ok: true, email: "visitor@example.com" });
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBe("visitor@example.com");
  });

  it("does not allow duplicate accounts", async () => {
    await createAccount("same@example.com", "pass1234");
    const duplicate = await createAccount("SAME@example.com", "pass5678");
    expect(duplicate).toEqual({ ok: false, error: "이미 가입된 이메일이에요. 로그인해 주세요." });
  });
});
