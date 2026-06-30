import { create } from 'zustand';
import { authApi } from '@/api/client';

const TOKEN_KEY = 'afios_token';
const USER_KEY = 'afios_user';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  organizationId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function persistSession(token: string, user: User) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (user.organizationId) {
    localStorage.setItem('afios_active_org', user.organizationId);
  }
}

function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login(email, password);
      persistSession(data.accessToken, data.user);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearSession();
    set({ user: null, token: null });
  },

  hydrate: () => {
    const token = readToken();
    const userStr = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    if (token && userStr) {
      const user = JSON.parse(userStr) as User;
      persistSession(token, user);
      set({ token, user });
    }
  },
}));

export function getStoredToken(): string | null {
  return readToken();
}
