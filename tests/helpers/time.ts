/** Local date-time helper: `at('2026-10-22', '08:30')`. */
export function at(dayKey: string, hhmm: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export const hm = (h: number, m = 0) => h * 60 + m;
