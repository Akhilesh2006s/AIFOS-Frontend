import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, cn } from './utils';

describe('utils', () => {
  it('cn merges class names', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('formatCurrency uses crore/lakh thresholds', () => {
    expect(formatCurrency(1_50_00_000)).toBe('₹1.5Cr');
    expect(formatCurrency(5_00_000)).toBe('₹5.0L');
    expect(formatCurrency(999)).toBe('₹999');
  });

  it('formatDate returns en-IN formatted string', () => {
    const formatted = formatDate('2026-01-15');
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2026/);
  });
});
