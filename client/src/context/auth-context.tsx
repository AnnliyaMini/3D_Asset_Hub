import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api.js';
import type { User } from '../types/types.ts';

type AuthValue = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, name: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  ready: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api.getToken()) {
      setReady(true);
      return;
    }
    api.me()
      .then((res) => setUser(res.user))
      .catch(() => api.setToken(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    ready,
    signIn: async (email, password) => {
      const res = await api.login(email, password);
      api.setToken(res.token);
      setUser(res.user);
    },
    signUp: async (email, name, password) => {
      const res = await api.register(email, name, password);
      api.setToken(res.token);
      setUser(res.user);
    },
    signOut: () => {
      api.setToken(null);
      setUser(null);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
