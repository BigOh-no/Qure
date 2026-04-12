import {
  signUp,
  login,
  loginGoogle,
  handleGoogleUser,
  getUserRole,
  ensureUserProfile,
} from '../lib/auth';

import { supabaseClient } from '../lib/supabaseClient';

// Mock Supabase so tests only verify our auth logic,
// not Supabase's internal implementation.
jest.mock('../lib/supabaseClient', () => ({
  supabaseClient: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('auth.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock browser location because auth redirects depend on window.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    });
  });

  describe('signUp', () => {
    test('signs up a user successfully and returns the user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'patient@example.com',
      };

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await signUp('patient@example.com', 'password123');

      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'patient@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      });

      expect(result).toEqual(mockUser);
    });

    test('throws an error when signup fails', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: new Error('Signup failed'),
      });

      await expect(
        signUp('patient@example.com', 'password123')
      ).rejects.toThrow('Signup failed');
    });
  });

  describe('ensureUserProfile', () => {
    test('does nothing if the profile already exists', async () => {
      const user = {
        id: 'existing-user',
        email: 'existing@example.com',
      };

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: { id: 'existing-user' },
        error: null,
      });

      const eqMock = jest.fn().mockReturnValue({
        maybeSingle: maybeSingleMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock,
      });

      supabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      await ensureUserProfile(user);

      expect(supabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(selectMock).toHaveBeenCalledWith('id');
      expect(eqMock).toHaveBeenCalledWith('id', 'existing-user');
    });

    test('inserts a profile if one does not exist', async () => {
      const user = {
        id: 'new-user',
        email: 'new@example.com',
      };

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const eqMock = jest.fn().mockReturnValue({
        maybeSingle: maybeSingleMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock,
      });

      const insertMock = jest.fn().mockResolvedValue({
        error: null,
      });

      supabaseClient.from
        .mockReturnValueOnce({
          select: selectMock,
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      await ensureUserProfile(user);

      expect(insertMock).toHaveBeenCalledWith([
        {
          id: 'new-user',
          email: 'new@example.com',
          role: 'patient',
        },
      ]);
    });

    test('throws an error if profile insert fails', async () => {
      const user = {
        id: 'insert-fail-user',
        email: 'insertfail@example.com',
      };

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const eqMock = jest.fn().mockReturnValue({
        maybeSingle: maybeSingleMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock,
      });

      const insertMock = jest.fn().mockResolvedValue({
        error: new Error('Profile insert failed'),
      });

      supabaseClient.from
        .mockReturnValueOnce({
          select: selectMock,
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      await expect(ensureUserProfile(user)).rejects.toThrow(
        'Profile insert failed'
      );
    });
  });

  describe('login', () => {
    test('logs in a user successfully and returns the user', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'login@example.com',
      };

      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await login('login@example.com', 'mypassword');

      expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'login@example.com',
        password: 'mypassword',
      });

      expect(result).toEqual(mockUser);
    });

    test('throws an error if login fails', async () => {
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid login credentials'),
      });

      await expect(
        login('login@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('loginGoogle', () => {
    test('starts Google OAuth successfully', async () => {
      const mockData = {
        provider: 'google',
        url: 'https://accounts.google.com',
      };

      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await loginGoogle();

      expect(supabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });

      expect(result).toEqual(mockData);
    });

    test('throws an error if Google OAuth fails', async () => {
      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: new Error('Google OAuth failed'),
      });

      await expect(loginGoogle()).rejects.toThrow('Google OAuth failed');
    });
  });

  describe('handleGoogleUser', () => {
    test('returns null if no Google user is found', async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await handleGoogleUser('patient');

      expect(result).toBeNull();
    });

    test('returns the user if the profile already exists', async () => {
      const mockUser = {
        id: 'google-123',
        email: 'googleuser@example.com',
      };

      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'google-123' },
        error: null,
      });

      const eqMock = jest.fn().mockReturnValue({
        single: singleMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock,
      });

      supabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      const result = await handleGoogleUser('patient');

      expect(supabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(selectMock).toHaveBeenCalledWith('id');
      expect(eqMock).toHaveBeenCalledWith('id', 'google-123');
      expect(result).toEqual(mockUser);
    });

    test('creates a profile for a new Google user', async () => {
      const mockUser = {
        id: 'google-456',
        email: 'newgoogleuser@example.com',
      };

      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValue({
        error: null,
      });

      supabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      const result = await handleGoogleUser('patient');

      expect(insertMock).toHaveBeenCalledWith([
        {
          id: 'google-456',
          email: 'newgoogleuser@example.com',
          role: 'patient',
        },
      ]);

      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserRole', () => {
    test('returns the user role if found', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: { role: 'patient' },
        error: null,
      });

      const eqMock = jest.fn().mockReturnValue({
        single: singleMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock,
      });

      supabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      const result = await getUserRole('user@example.com');

      expect(supabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(selectMock).toHaveBeenCalledWith('role');
      expect(eqMock).toHaveBeenCalledWith('email', 'user@example.com');
      expect(result).toBe('patient');
    });

    test('throws an error if role lookup fails', async () => {
      supabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Role lookup failed'),
            }),
          }),
        }),
      });

      await expect(getUserRole('fail@example.com')).rejects.toThrow(
        'Role lookup failed'
      );
    });
  });
});