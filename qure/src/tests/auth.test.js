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

jest.mock("../lib/supabaseClient");

describe("auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // =========================
    // AUTH MOCKS
    // =========================
    supabaseClient.auth = {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    };

    // =========================
    // DB MOCK
    // =========================
    supabaseClient.from = jest.fn(() => ({
      upsert: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
        })),
      })),
    }));

    // =========================
    // EDGE FUNCTIONS MOCK
    // =========================
    supabaseClient.functions = {
      invoke: jest.fn(),
    };
  });

  // -------------------------
  // SIGN UP
  // -------------------------
  test("signUp creates user and profile", async () => {
    supabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: "1", email: "test@test.com" } },
      error: null,
    });

    supabaseClient.from.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });
    const result = await signUp("TEST@test.com", "password");

    expect(result.id).toBe("1");
  });

  test("signUp throws error", async () => {
    supabaseClient.auth.signUp.mockResolvedValue({
      data: null,
      error: new Error("fail"),
    });

    await expect(signUp("a@b.com", "123")).rejects.toThrow("fail");
  });

  // -------------------------
  // LOGIN
  // -------------------------
  test("login returns user", async () => {
    supabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });

    const result = await login("test@test.com", "123");

    expect(result.id).toBe("1");
  });

  // -------------------------
  // GOOGLE LOGIN
  // -------------------------
  test("loginGoogle returns data", async () => {
    supabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "redirect" },
      error: null,
    });

    const result = await loginGoogle();

    expect(result.url).toBe("redirect");
  });

  // -------------------------
  // HANDLE GOOGLE USER
  // -------------------------
  test("handleGoogleUser returns user", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "1", email: "a@b.com" } },
      error: null,
    });

    const maybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    supabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle,
        })),
      })),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const result = await handleGoogleUser();

    expect(result.id).toBe("1");
  });

  // -------------------------
  // GET USER ROLE
  // -------------------------
  test("getUserRole returns role", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    supabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle,
        })),
      })),
    });

    const role = await getUserRole("123");

    expect(role).toBe("admin");
  });

  // -------------------------
  // ENSURE USER PROFILE
  // -------------------------
  test("ensureUserProfile returns existing profile", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: "1", email: "a@b.com", role: "patient" },
      error: null,
    });

    supabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle,
        })),
      })),
    });

    const result = await ensureUserProfile({
      id: "1",
      email: "a@b.com",
    });

    expect(result.role).toBe("patient");
  });

  // -------------------------
  // CREATE ADMIN INVITE
  // -------------------------
  test("createAdminInvite calls edge function", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    supabaseClient.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const result = await createAdminInvite("test@test.com");

    expect(supabaseClient.functions.invoke).toHaveBeenCalledWith(
      "create-admin",
      expect.any(Object)
    );

    expect(result.success).toBe(true);
  });

  // -------------------------
  // RESET PASSWORD
  // -------------------------
  test("sendResetPasswordEmail works", async () => {
    supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });

    await sendResetPasswordEmail("test@test.com");

    expect(
      supabaseClient.auth.resetPasswordForEmail
    ).toHaveBeenCalled();
  });

  // -------------------------
  // UPDATE PASSWORD
  // -------------------------
  test("updatePassword returns data", async () => {
    supabaseClient.auth.updateUser.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });

    const result = await updatePassword("newpass");

    expect(result.user.id).toBe("1");
  });

  // -------------------------
  // LOGOUT
  // -------------------------
  test("logout calls signOut", async () => {
    supabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });

    await logout();

    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });
});