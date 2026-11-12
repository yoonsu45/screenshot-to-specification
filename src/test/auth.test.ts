import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: authMocks },
}));

import { authenticateAccount, createAccount } from "@/lib/auth";

describe("Supabase account authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a real Supabase account", async () => {
    authMocks.signUp.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "visitor@example.com" },
        session: { access_token: "token" },
      },
      error: null,
    });

    await expect(createAccount("VISITOR@example.com", "pass1234")).resolves.toEqual({
      ok: true,
      email: "visitor@example.com",
      userId: "user-1",
    });
    expect(authMocks.signUp).toHaveBeenCalledWith({
      email: "visitor@example.com",
      password: "pass1234",
    });
  });

  it("shows a Korean message for invalid credentials", async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(authenticateAccount("visitor@example.com", "wrong-password")).resolves.toEqual({
      ok: false,
      error: "아이디 또는 비밀번호가 맞지 않아요.",
    });
  });
});
