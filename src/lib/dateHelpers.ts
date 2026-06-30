export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isToday(value?: string | Date | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  const t = startOfToday();
  return d >= t && d < new Date(t.getTime() + 86400000);
}

export function isOverdue(value?: string | Date | null): boolean {
  if (!value) return false;
  return new Date(value) < startOfToday();
}
