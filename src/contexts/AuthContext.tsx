import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { uid } from '@/lib/utils';
import { loadState, saveState, StorageKeys } from '@/lib/storage';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email'>>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * This is a local-only account, held in this browser. There is no server and
 * no password check — the credentials are not verified against anything, and
 * the data lives in localStorage. Wire `login`/`register` to a real backend
 * before treating any of this as authentication.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Enter your email address.';
  if (!EMAIL_RE.test(email.trim())) return 'That email address does not look right.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  return null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(loadState<User | null>(StorageKeys.user, null));
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const emailError = validateEmail(email);
    if (emailError) throw new AuthError(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new AuthError(passwordError);

    const existing = loadState<User | null>(StorageKeys.user, null);
    // Returning to an account already on this device keeps its name and id.
    const next: User =
      existing && existing.email.toLowerCase() === email.trim().toLowerCase()
        ? existing
        : {
            id: uid(),
            email: email.trim(),
            name: email.trim().split('@')[0],
            createdAt: new Date(),
          };

    setUser(next);
    saveState(StorageKeys.user, next);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const emailError = validateEmail(email);
    if (emailError) throw new AuthError(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new AuthError(passwordError);
    if (!name.trim()) throw new AuthError('Enter your name.');

    const next: User = {
      id: uid(),
      email: email.trim(),
      name: name.trim(),
      createdAt: new Date(),
    };
    setUser(next);
    saveState(StorageKeys.user, next);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveState(StorageKeys.user, null);
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<Pick<User, 'name' | 'email'>>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        saveState(StorageKeys.user, next);
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
