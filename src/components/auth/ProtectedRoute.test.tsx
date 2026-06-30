import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const mockState = {
  token: null as string | null,
  user: null as { role: string } | null,
};

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
  getStoredToken: () => mockState.token,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/mission-control" element={<div>mission-control</div>} />
        <Route path="/dashboard/store-keeper" element={<div>store-keeper-dashboard</div>} />
        <Route path="/dashboard/finance" element={<div>finance-dashboard</div>} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div>protected-content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockState.token = null;
    mockState.user = null;
  });

  it('redirects unauthenticated users to login', async () => {
    renderAt('/projects');
    expect(await screen.findByText('login-page')).toBeInTheDocument();
  });

  it('renders children for authenticated admin', () => {
    mockState.token = 'token';
    mockState.user = { role: 'admin' };
    renderAt('/admin/users');
    expect(screen.getByText('protected-content')).toBeInTheDocument();
  });

  it('redirects store_keeper away from admin paths', async () => {
    mockState.token = 'token';
    mockState.user = { role: 'store_keeper' };
    renderAt('/admin/users');
    expect(await screen.findByText('store-keeper-dashboard')).toBeInTheDocument();
  });

  it('allows store_keeper on inventory routes', () => {
    mockState.token = 'token';
    mockState.user = { role: 'store_keeper' };
    renderAt('/inventory');
    expect(screen.getByText('protected-content')).toBeInTheDocument();
  });

  it('redirects finance_manager from procurement', async () => {
    mockState.token = 'token';
    mockState.user = { role: 'finance_manager' };
    renderAt('/procurement');
    expect(await screen.findByText('finance-dashboard')).toBeInTheDocument();
  });

  it('redirects store_keeper away from other role dashboards', async () => {
    mockState.token = 'token';
    mockState.user = { role: 'store_keeper' };
    render(
      <MemoryRouter initialEntries={['/dashboard/finance']}>
        <Routes>
          <Route path="/dashboard/store-keeper" element={<div>store-keeper-dashboard</div>} />
          <Route
            path="/dashboard/finance"
            element={
              <ProtectedRoute>
                <div>finance-dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('store-keeper-dashboard')).toBeInTheDocument();
  });

  it('redirects org_admin away from procurement', async () => {
    mockState.token = 'token';
    mockState.user = { role: 'org_admin' };
    render(
      <MemoryRouter initialEntries={['/procurement']}>
        <Routes>
          <Route path="/dashboard/org-admin" element={<div>org-admin-dashboard</div>} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div>protected-content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('org-admin-dashboard')).toBeInTheDocument();
  });
});
