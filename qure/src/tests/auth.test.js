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

// ---------------- MOCK SUPABASE ----------------
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

// ---------------- HELPERS ----------------
const mockQueryBuilder = () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn(),
    upsert: jest.fn().mockReturnThis(),
  };
  return chain;
};

describe("auth.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- SIGN UP ----------------
  test("signUp returns user on success", async () => {
    supabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: "1", email: "test@test.com" } },
      error: null,
    });

    const user = await signUp("test@test.com", "123456");

    expect(user.email).toBe("test@test.com");
  });

  test("signUp throws on error", async () => {
    supabaseClient.auth.signUp.mockResolvedValue({
      data: null,
      error: new Error("fail"),
    });

    await expect(signUp("a", "b")).rejects.toThrow("fail");
  });

  test("signUp returns null if no user", async () => {
    supabaseClient.auth.signUp.mockResolvedValue({
      data: {},
      error: null,
    });

    const result = await signUp("a", "b");
    expect(result).toBeNull();
  });

  // ---------------- LOGIN ----------------
  test("login returns user", async () => {
    supabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });

    const user = await login("a", "b");
    expect(user.id).toBe("1");
  });

  test("login throws on error", async () => {
    supabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: new Error("bad login"),
    });

    await expect(login("a", "b")).rejects.toThrow("bad login");
  });

  // ---------------- GOOGLE LOGIN ----------------
  test("loginGoogle works", async () => {
    supabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google" },
      error: null,
    });

    const res = await loginGoogle();
    expect(res.provider).toBe("google");
  });

  test("loginGoogle throws on error", async () => {
    supabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: new Error("oauth fail"),
    });

    await expect(loginGoogle()).rejects.toThrow("oauth fail");
  });

  // ---------------- HANDLE GOOGLE USER ----------------
  test("handleGoogleUser creates profile if missing", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "1", email: "a@test.com" } },
      error: null,
    });

    const query = mockQueryBuilder();
    query.single.mockResolvedValue({ data: null });
    query.insert.mockResolvedValue({ error: null });

    supabaseClient.from.mockReturnValue(query);

    const user = await handleGoogleUser();

    expect(query.insert).toHaveBeenCalled();
    expect(user.id).toBe("1");
  });

  test("handleGoogleUser skips insert if profile exists", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "1", email: "a@test.com" } },
      error: null,
    });

    const query = mockQueryBuilder();
    query.single.mockResolvedValue({ data: { id: "1" } });

    supabaseClient.from.mockReturnValue(query);

    const user = await handleGoogleUser();

    expect(query.insert).not.toHaveBeenCalled();
    expect(user.id).toBe("1");
  });

  // ---------------- GET USER ROLE ----------------
  test("getUserRole by email", async () => {
    const query = mockQueryBuilder();
    query.maybeSingle.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    supabaseClient.from.mockReturnValue(query);

    const role = await getUserRole("test@test.com");

    expect(role).toBe("admin");
  });

  test("getUserRole returns null if none", async () => {
    const query = mockQueryBuilder();
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    supabaseClient.from.mockReturnValue(query);

    const role = await getUserRole("test@test.com");

    expect(role).toBeNull();
  });

  // ---------------- ENSURE PROFILE ----------------
  test("ensureUserProfile upserts profile", async () => {
    const query = mockQueryBuilder();
    query.maybeSingle.mockResolvedValue({
      data: { id: "1" },
      error: null,
    });

    supabaseClient.from.mockReturnValue(query);

    const user = {
      id: "1",
      email: "TEST@MAIL.COM",
      user_metadata: { role: "admin" },
    };

    const res = await ensureUserProfile(user);

    expect(query.upsert).toHaveBeenCalled();
    expect(res.id).toBe("1");
  });

  // ---------------- CREATE ADMIN INVITE ----------------
  test("createAdminInvite success", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    supabaseClient.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const res = await createAdminInvite("TEST@MAIL.COM");

    expect(res.success).toBe(true);
  });

  test("createAdminInvite throws if not logged in", async () => {
    supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(createAdminInvite("a")).rejects.toThrow("User not logged in");
  });

  // ---------------- RESET PASSWORD ----------------
  test("sendResetPasswordEmail works", async () => {
    supabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });

    await expect(
      sendResetPasswordEmail("test@test.com")
    ).resolves.toBeUndefined();
  });

  // ---------------- UPDATE PASSWORD ----------------
  test("updatePassword works", async () => {
    supabaseClient.auth.updateUser.mockResolvedValue({
      data: { user: {} },
      error: null,
    });

    const res = await updatePassword("123456");
    expect(res.user).toBeDefined();
  });

  // ---------------- LOGOUT ----------------
  test("logout works", async () => {
    supabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });

    await expect(logout()).resolves.toBeUndefined();
  });
});