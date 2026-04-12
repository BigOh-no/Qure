// Import the functions we want to test from auth.js
import {
  signUp,
  login,
  loginGoogle,
  handleGoogleUser,
  getUserRole,
} from '../lib/auth';

// Import the Supabase client so we can mock its methods
import { supabaseClient } from '../lib/supabaseClient';

/*
  Mock the entire supabaseClient module.

  This means when auth.js imports supabaseClient,
  it will receive this fake version instead of the real one.
*/
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
  /*
    Clear all mock history before each test.

    This prevents one test from affecting another test.
    For example, it clears previous calls to signUp(), from(), etc.
  */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // signUp tests
  describe('signUp', () => {
    test('should sign up a user', async () => {
      // Fake user returned by Supabase auth.signUp
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      /*
        Pretend Supabase auth signup succeeded and returned a user.
      */
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await signUp('test@example.com', 'password123', 'patient');

      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      expect(result).toEqual(mockUser);
    });

    test('should throw an error if Supabase signup fails', async () => {
      // Fake error returned by Supabase
      const mockError = new Error('Signup failed');

      supabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      /*
        Since the function throws, we use expect(...).rejects
        because signUp is async.
      */
      await expect(
        signUp('test@example.com', 'password123', 'patient')
      ).rejects.toThrow('Signup failed');
    });

    test('should return null if no user is returned', async () => {
      /*
        Signup succeeds in the sense that there is no error,
        but no user object comes back.
      */
      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await signUp('test@example.com', 'password123', 'patient');

      // The function should return null in this branch
      expect(result).toBeNull();
    });

    
  });

 
  // login tests
  describe('login', () => {
    test('should log in a user successfully and return the user', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'login@example.com',
      };

      /*
        Pretend the password login worked and returned a user.
      */
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await login('login@example.com', 'mypassword');

      // Check the correct Supabase auth method was called
      expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'login@example.com',
        password: 'mypassword',
      });

      // login() should return the user
      expect(result).toEqual(mockUser);
    });

    test('should throw an error if login fails', async () => {
      const mockError = new Error('Invalid login credentials');

      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        login('login@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid login credentials');
    });
  });

 
  // loginGoogle tests
  describe('loginGoogle', () => {
    test('should start Google OAuth login successfully', async () => {
      const mockData = {
        provider: 'google',
        url: 'https://accounts.google.com',
      };

      /*
        loginGoogle uses window.location.origin
        to build the redirect URL.

        In Jest, we define it manually so the test
        has a predictable value.
      */
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      });

      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await loginGoogle();

      // Check that Google OAuth was called with the correct config
      expect(supabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });

      expect(result).toEqual(mockData);
    });

    test('should throw an error if Google OAuth fails', async () => {
      const mockError = new Error('Google OAuth failed');

      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      });

      supabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(loginGoogle()).rejects.toThrow('Google OAuth failed');
    });
  });

  
  // handleGoogleUser tests
  describe('handleGoogleUser', () => {
    test('should throw an error if getUser fails', async () => {
      const mockError = new Error('Failed to get user');

      supabaseClient.auth.getUser.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(handleGoogleUser('patient')).rejects.toThrow(
        'Failed to get user'
      );
    });

    test('should return null if no Google user is found', async () => {
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await handleGoogleUser('patient');

      expect(result).toBeNull();
    });

    test('should return the user if profile already exists', async () => {
      const mockUser = {
        id: 'google-123',
        email: 'googleuser@example.com',
      };

      // getUser succeeds
      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      /*
        This mocks:
        supabaseClient.from('profiles').select('id').eq('id', ...).single()
      */
      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'google-123' }, // existing profile found
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

      // Since profile exists, no insert should happen
      expect(result).toEqual(mockUser);
    });

    test('should insert a new profile if one does not already exist', async () => {
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

      /*
        Here we need two different .from('profiles') behaviors:

        1st call:
        used for select(...).eq(...).single()
        returns no existing profile

        2nd call:
        used for insert(...)
      */
      supabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null, // no profile exists
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

    test('should throw an error if inserting new Google profile fails', async () => {
      const mockUser = {
        id: 'google-789',
        email: 'failgoogleuser@example.com',
      };

      const profileError = new Error('Google profile insert failed');

      supabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValue({
        error: profileError,
      });

      supabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null, // no profile found
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      await expect(handleGoogleUser('patient')).rejects.toThrow(
        'Google profile insert failed'
      );
    });
  });


  // getUserRole tests
  describe('getUserRole', () => {
    test('should return the user role if found', async () => {
      /*
        Mock this chain:
        supabaseClient.from('profiles').select('role').eq('id', userId).single()
      */
      supabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'patient' },
              error: null,
            }),
          }),
        }),
      });

      const result = await getUserRole('user-123');

      expect(result).toBe('patient');
    });

    test('should return null if no role is found', async () => {
      supabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        }),
      });

      const result = await getUserRole('user-123');

      expect(result).toBeNull();
    });

    test('should throw an error if role lookup fails', async () => {
      const mockError = new Error('Role lookup failed');

      supabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(getUserRole('user-123')).rejects.toThrow(
        'Role lookup failed'
      );
    });
  });
});