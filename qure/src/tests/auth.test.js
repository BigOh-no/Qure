import {
  signUp,
  login,
  loginGoogle,
  handleGoogleUser,
  getUserRole,
  ensureUserProfile,
  createAdminInvite,
  sendResetPasswordEmail,
  updatePassword,
  logout,
} from "../lib/auth";

import { supabaseClient } from "../lib/supabaseClient";

//  Full Supabase mock
jest.mock("../lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("auth.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  // ---------------- SIGN UP ----------------
  describe("signUp", () => {
    test("returns user on success", async () => {
      const mockUser = { id: "1", email: "test@test.com" };

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await signUp("test@test.com", "123456");

      expect(result).toEqual(mockUser);
    });

    test("throws on error", async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: new Error("fail"),
      });

      await expect(signUp("a", "b")).rejects.toThrow("fail");
    });

    test("returns null if no user", async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await signUp("a", "b");
      expect(result).toBeNull();
    });
  });

  // ---------------- LOGIN ----------------
  describe("login", () => {
    test("returns user", async () => {
      const mockUser = { id: "2" };

      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await login("a", "b");
      expect(result).toEqual(mockUser);
    });

    test("throws on error", async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error("bad login"),
      });

      await expect(login("a", "b")).rejects.toThrow("bad login");
    });
  });

  // ---------------- GOOGLE LOGIN ----------------
  describe("loginGoogle", () => {
    test("returns data", async () => {
      const mockData = { provider: "google" };

      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await loginGoogle();
      expect(result).toEqual(mockData);
    });

    test("throws on error", async () => {
      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: new Error("oauth fail"),
      });

      await expect(loginGoogle()).rejects.toThrow("oauth fail");
    });
  });

  // ---------------- GOOGLE USER HANDLING ----------------
  describe("handleGoogleUser", () => {
    test("returns null if no user", async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await handleGoogleUser();
      expect(result).toBeNull();
    });

    test("creates profile if not exists", async () => {
      const user = { id: "1", email: "x@test.com" };

      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValue({ error: null });

      supabaseClient.from
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      const result = await handleGoogleUser();

      expect(insertMock).toHaveBeenCalled();
      expect(result).toEqual(user);
    });
  });

  // ---------------- GET USER ROLE ----------------
  describe("getUserRole", () => {
  test("returns role", async () => {
    supabaseClient.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { role: "admin" },
            error: null,
          }),
        }),
      }),
    });

    const result = await getUserRole("a@test.com");
    expect(result).toBe("admin");
  });

  test("throws on error", async () => {
    supabaseClient.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: new Error("fail"),
          }),
        }),
      }),
    });

    await expect(getUserRole("x")).rejects.toThrow("fail");
  });
});

  // ---------------- ENSURE PROFILE ----------------
  describe("ensureUserProfile", () => {
    test("inserts if missing", async () => {
      const user = { id: "1", email: "a@test.com" };

      const insertMock = jest.fn().mockResolvedValue({ error: null });

      supabaseClient.from
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      await ensureUserProfile(user);

      expect(insertMock).toHaveBeenCalled();
    });
  });

  // ---------------- CREATE ADMIN INVITE ----------------
  describe("createAdminInvite", () => {
    test("calls edge function successfully", async () => {
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
        error: null,
      });

      supabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await createAdminInvite("ADMIN@test.com");

      expect(supabaseClient.functions.invoke).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test("throws if no session", async () => {
      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(createAdminInvite("a")).rejects.toThrow(
        "User not logged in"
      );
    });
  });

  // ---------------- PASSWORD RESET ----------------
  describe("sendResetPasswordEmail", () => {
    test("calls reset email", async () => {
      supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      await sendResetPasswordEmail("a@test.com");

      expect(
        supabaseClient.auth.resetPasswordForEmail
      ).toHaveBeenCalled();
    });
  });

  // ---------------- UPDATE PASSWORD ----------------
  describe("updatePassword", () => {
    test("updates password", async () => {
      supabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      const result = await updatePassword("newpass");

      expect(result).toBeDefined();
    });
  });

  // ---------------- LOGOUT ----------------
  describe("logout", () => {
    test("logs out successfully", async () => {
      supabaseClient.auth.signOut.mockResolvedValue({ error: null });

      await logout();

      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    });

    test("throws on error", async () => {
      supabaseClient.auth.signOut.mockResolvedValue({
        error: new Error("fail"),
      });

      await expect(logout()).rejects.toThrow("fail");
    });
  });
});