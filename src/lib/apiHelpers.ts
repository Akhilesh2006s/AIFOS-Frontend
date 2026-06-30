/** Normalize list API responses (plain array or paginated envelope). */
export function unwrapList<T>(payload: T[] | { data: T[] } | undefined | null): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}
