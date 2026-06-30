import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      data: {
        accessToken: 'test-token',
        user: { id: '1', name: 'Test', email: 't@test.com', role: 'admin' },
      },
    }),
    me: vi.fn(),
  },
}));

import { useAuthStore } from './auth';

describe('auth store', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isLoading: false });
  });

  it('persists token in sessionStorage on login', async () => {
    await useAuthStore.getState().login('t@test.com', 'password');
    expect(sessionStorage.getItem('afios_token')).toBe('test-token');
    expect(localStorage.getItem('afios_token')).toBeNull();
    expect(useAuthStore.getState().token).toBe('test-token');
  });

  it('clears session on logout', () => {
    sessionStorage.setItem('afios_token', 'x');
    sessionStorage.setItem('afios_user', '{}');
    useAuthStore.setState({ token: 'x', user: { id: '1', name: 'A', email: 'a@b.com', role: 'user' } });
    useAuthStore.getState().logout();
    expect(sessionStorage.getItem('afios_token')).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('hydrates from sessionStorage', () => {
    sessionStorage.setItem('afios_token', 'hydrated');
    sessionStorage.setItem('afios_user', JSON.stringify({ id: '1', name: 'A', email: 'a@b.com', role: 'user' }));
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().token).toBe('hydrated');
  });
});
