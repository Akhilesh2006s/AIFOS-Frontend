import { describe, it, expect } from 'vitest';
import { unwrapList } from './apiHelpers';

describe('unwrapList', () => {
  it('returns empty array for nullish input', () => {
    expect(unwrapList(null)).toEqual([]);
    expect(unwrapList(undefined)).toEqual([]);
  });

  it('returns plain arrays as-is', () => {
    expect(unwrapList([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('unwraps paginated envelopes', () => {
    expect(unwrapList({ data: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it('returns empty when data missing', () => {
    expect(unwrapList({ data: undefined as unknown as [] })).toEqual([]);
  });
});
