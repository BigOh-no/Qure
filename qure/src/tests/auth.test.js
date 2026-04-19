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

// ---------------- QUERY BUILDER MOCK ----------------
const createQuery = () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };
  return query;
};

describe("auth.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- SIGN UP ----------------
  test("signUp success", async () => {
    supabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: "1", email: "a@test.com" } },
      error: null,
    });

    const user = await signUp("a@test.com", "123");

    expect(user.email).toBe("a@test.com");
  });

  test("signUp throws error", async () => {
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
  test("login success", async () => {
    supabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });

    const user = await login("a", "b");
    expect(user.id).toBe("1");
  });

  // ---------------- GOOGLE LOGIN ----------------
  test("loginGoogle success", async () => {
    supabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google" },
      error: null,
    });

    const res = await loginGoogle();
    expect(res.provider).toBe("google");
  });

  // ---------------- HANDLE GOOGLE USER ----------------
  test("handleGoogleUser creates profile if missing", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "1", email: "a@test.com" } },
      error: null,
    });

    const query = createQuery();
    query.single.mockResolvedValue({ data: null });
    query.insert.mockResolvedValue({ error: null });

    supabaseClient.from.mockReturnValue(query);

    const user = await handleGoogleUser();

    expect(query.insert).toHaveBeenCalled();
    expect(user.id).toBe("1");
  });

  test("handleGoogleUser skips insert if exists", async () => {
    supabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "1", email: "a@test.com" } },
      error: null,
    });

    const query = createQuery();
    query.single.mockResolvedValue({ data: { id: "1" } });

    supabaseClient.from.mockReturnValue(query);

    const user = await handleGoogleUser();

    expect(query.insert).not.toHaveBeenCalled();
  });

  // ---------------- GET USER ROLE ----------------
  test("getUserRole by email", async () => {
    const query = createQuery();
    query.maybeSingle.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    supabaseClient.from.mockReturnValue(query);

    const role = await getUserRole("test@test.com");
    expect(role).toBe("admin");
  });

  test("getUserRole null identifier", async () => {
    const role = await getUserRole(null);
    expect(role).toBeNull();
  });

  // ---------------- ENSURE USER PROFILE ----------------
  test("ensureUserProfile throws if no user", async () => {
    await expect(ensureUserProfile(null)).rejects.toThrow(
      "User is required."
    );
  });

  test("ensureUserProfile updates email if changed", async () => {
    const query = createQuery();

    query.maybeSingle.mockResolvedValue({
      data: { id: "1", email: "old@test.com", role: "patient" },
      error: null,
    });

    query.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    supabaseClient.from.mockReturnValue(query);

    const user = { id: "1", email: "NEW@test.com" };

    const result = await ensureUserProfile(user);

    expect(query.update).toHaveBeenCalled();
    expect(result.email).toBe("old@test.com");
  });

  test("ensureUserProfile inserts if not exists", async () => {
    const query = createQuery();

    query.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    query.insert.mockReturnValue({
      select: () => ({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: "1" },
          error: null,
        }),
      }),
    });

    supabaseClient.from.mockReturnValue(query);

    const user = {
      id: "1",
      email: "test@test.com",
      user_metadata: { role: "admin" },
    };

    const result = await ensureUserProfile(user);

    expect(result.id).toBe("1");
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

    await expect(createAdminInvite("a")).rejects.toThrow(
      "User not logged in"
    );
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

    const res = await updatePassword("123");
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