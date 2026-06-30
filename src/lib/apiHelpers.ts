import axios from 'axios';

/** Normalize list API responses (plain array or paginated envelope). */
export function unwrapList<T>(payload: T[] | { data: T[] } | undefined | null): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

/** Human-readable message from an Axios or unknown error. */
export function getApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string' && msg) return msg;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Run an API call; return fallback instead of throwing. */
export async function safeApi<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Run parallel API calls; never rejects — returns settled results. */
export async function settleApi<T extends readonly (() => Promise<unknown>)[]>(
  calls: T,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }> {
  const results = await Promise.allSettled(calls.map((fn) => fn()));
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null)) as {
    [K in keyof T]: Awaited<ReturnType<T[K]>> | null;
  };
}
