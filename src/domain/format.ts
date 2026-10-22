// PT-BR formatting for user-facing values (FR-004, FR-032).

/** 1250 → "1,25"; 2000 → "2"; 2500 → "2,5". */
export function formatLiters(ml: number): string {
  const liters = Math.round(ml / 10) / 100;
  return String(liters).replace('.', ',');
}

/** "1,25 / 2 L" */
export function formatProgress(consumedMl: number, goalMl: number): string {
  return `${formatLiters(consumedMl)} / ${formatLiters(goalMl)} L`;
}

/** "14h30"; "14h" when the minutes are zero. */
export function formatClock(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** "em 45 min" | "em 1h45" | "em 1h". Rounds up to the next whole minute (minimum 1). */
export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  if (totalMinutes < 60) return `em ${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `em ${h}h` : `em ${h}h${String(m).padStart(2, '0')}`;
}

/** "🔥 1 dia" | "🔥 n dias"; null when there is no streak. */
export function formatStreak(days: number): string | null {
  if (days < 1) return null;
  return `🔥 ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
