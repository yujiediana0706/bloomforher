'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { UserProfile } from '@/lib/types';
import { apiGet, apiSend } from '@/lib/client';
import { DEMO_ACCOUNTS } from '@/lib/accounts';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  switchAccount: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  switchAccount: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiSend<{ user: UserProfile | null }>(
        '/api/auth/session',
        'POST',
        { action: 'get' }
      );
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchAccount = useCallback(async (uid: string) => {
    const data = await apiSend<{ user: UserProfile }>(
      '/api/auth/session',
      'POST',
      { action: 'login', uid }
    );
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiSend('/api/auth/session', 'POST', { action: 'logout' });
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, switchAccount, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { DEMO_ACCOUNTS };
