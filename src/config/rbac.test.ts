import { describe, it, expect } from 'vitest';
import { canAccessRoute } from './rbac';

describe('rbac canAccessRoute', () => {
  it('allows platform admin on enterprise routes', () => {
    expect(canAccessRoute('admin', '/enterprise')).toBe(true);
    expect(canAccessRoute('admin', '/marketplace')).toBe(true);
  });

  it('denies org_admin from platform-only and operational modules', () => {
    expect(canAccessRoute('org_admin', '/enterprise')).toBe(false);
    expect(canAccessRoute('org_admin', '/procurement')).toBe(false);
    expect(canAccessRoute('org_admin', '/admin')).toBe(true);
    expect(canAccessRoute('org_admin', '/dashboard/org-admin')).toBe(true);
  });

  it('denies executive from admin console', () => {
    expect(canAccessRoute('executive', '/admin')).toBe(false);
    expect(canAccessRoute('executive', '/projects')).toBe(true);
  });

  it('scopes dashboards to owning role', () => {
    expect(canAccessRoute('store_keeper', '/dashboard/store-keeper')).toBe(true);
    expect(canAccessRoute('store_keeper', '/dashboard/finance')).toBe(false);
    expect(canAccessRoute('finance_manager', '/dashboard/finance')).toBe(true);
    expect(canAccessRoute('finance_manager', '/dashboard/store-keeper')).toBe(false);
  });

  it('denies finance_manager from procurement', () => {
    expect(canAccessRoute('finance_manager', '/procurement')).toBe(false);
    expect(canAccessRoute('finance_manager', '/business')).toBe(true);
  });

  it('scopes explorer by entity module', () => {
    expect(canAccessRoute('store_keeper', '/explore/grn/abc')).toBe(true);
    expect(canAccessRoute('store_keeper', '/explore/purchase-order/abc')).toBe(false);
    expect(canAccessRoute('procurement_manager', '/explore/purchase-order/abc')).toBe(true);
  });

  it('denies store_keeper from intelligence', () => {
    expect(canAccessRoute('store_keeper', '/intelligence')).toBe(false);
    expect(canAccessRoute('equipment_manager', '/intelligence')).toBe(true);
  });
});
